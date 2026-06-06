import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AbrirFichaDesdeTurnoDto } from 'src/application/turnos/dtos/abrir-ficha-desde-turno.dto';
import { AbrirFichaDesdeTurnoResponseDto } from 'src/application/turnos/dtos/abrir-ficha-desde-turno-response.dto';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

/**
 * Centraliza el marcado de `ficha_salud.revisada_por_nutricionista_at`
 * al abrir una ficha desde un turno (RB45).
 *
 * Si el socio no tiene ficha registrada, no falla — devuelve
 * `{ fichaId: null, revisada: false, revisadaAt: null }`.
 *
 * Validaciones:
 * - El turno debe existir y pertenecer al gimnasio del tenant (RB25).
 * - Si el actor es NUTRICIONISTA, debe tener al menos un turno previo
 *   con el socio (RB13). Para ADMIN / RECEPCIONISTA no aplica (heredan
 *   el permiso por rol).
 */
@Injectable()
export class AbrirFichaDesdeTurnoUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepository: Repository<FichaSaludOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    input: AbrirFichaDesdeTurnoDto,
  ): Promise<AbrirFichaDesdeTurnoResponseDto> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: input.turnoId,
        socio: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(input.turnoId));
    }

    // RB13: nutricionista debe tener historial con el socio.
    if (this.tenantContext.rol === Rol.NUTRICIONISTA) {
      const tieneVinculo = await this.turnoRepository.count({
        where: {
          nutricionista: {
            idPersona: input.nutricionistaId,
            gimnasioId: this.tenantContext.gimnasioId,
          },
          socio: { idPersona: input.socioId },
        },
      });

      if (tieneVinculo === 0) {
        throw new ForbiddenError('No tiene turnos con este socio.');
      }
    }

    const socio = turno.socio;
    if (!socio || socio.fichaSalud == null) {
      return { fichaId: null, revisada: false, revisadaAt: null };
    }

    if (socio.fichaSalud.idFichaSalud == null) {
      return { fichaId: null, revisada: false, revisadaAt: null };
    }

    const revisadaAt = new Date();
    await this.fichaSaludRepository.update(
      { idFichaSalud: socio.fichaSalud.idFichaSalud },
      { revisadaPorNutricionistaAt: revisadaAt },
    );

    return {
      fichaId: socio.fichaSalud.idFichaSalud,
      revisada: true,
      revisadaAt,
    };
  }
}
