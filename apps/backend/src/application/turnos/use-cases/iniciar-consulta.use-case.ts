import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class IniciarConsultaUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    turnoId: number,
  ): Promise<{ success: boolean; estado: EstadoTurno }> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        socio: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new BadRequestError('Turno no encontrado');
    }

    if (turno.estadoTurno !== EstadoTurno.PRESENTE) {
      throw new BadRequestError(
        `No se puede iniciar consulta en un turno con estado ${turno.estadoTurno}`,
      );
    }

    turno.estadoTurno = EstadoTurno.EN_CURSO;
    turno.consultaIniciadaAt = new Date();

    await this.turnoRepository.save(turno);

    return { success: true, estado: EstadoTurno.EN_CURSO };
  }
}
