import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  DatosTurnoSocioResponseDto,
  NutricionistaTurnoSocioDto,
  SocioTurnoConfirmadoDto,
} from 'src/application/turnos/dtos/datos-turno-socio-response.dto';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  SocioOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class GetTurnoSocioByIdUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    userId: number,
    turnoId: number,
  ): Promise<DatosTurnoSocioResponseDto> {
    const socio = await this.resolveSocioByUserId(userId);
    if (!socio.idPersona) {
      throw new NotFoundError('Socio', String(userId));
    }

    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        nutricionista: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: ['socio', 'nutricionista'],
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    if (turno.estadoTurno === EstadoTurno.CANCELADO) {
      throw new ForbiddenError('El turno está cancelado.');
    }

    if (turno.socio?.idPersona !== socio.idPersona) {
      throw new ForbiddenError('No tenés permiso para consultar este turno.');
    }

    const socioResponse: SocioTurnoConfirmadoDto = {
      idPersona: turno.socio.idPersona,
      nombre: turno.socio.nombre,
      apellido: turno.socio.apellido,
      dni: turno.socio.dni,
      email: '',
      telefono: turno.socio.telefono ?? null,
    };

    const nutri = turno.nutricionista;
    const fotoPerfilUrl = nutri?.fotoPerfilKey
      ? `/profesional/${nutri.idPersona}/foto?v=${encodeURIComponent(nutri.fotoPerfilKey)}`
      : null;

    const nutricionistaResponse: NutricionistaTurnoSocioDto = {
      idPersona: nutri?.idPersona ?? 0,
      nombre: nutri?.nombre ?? '',
      apellido: nutri?.apellido ?? '',
      matricula: (nutri as { matricula?: string } | null)?.matricula ?? '',
      especialidad: 'Nutricionista',
      ciudad: nutri?.ciudad ?? '',
      provincia: nutri?.provincia ?? '',
      fotoPerfilUrl,
    };

    const fechaTurno =
      turno.fechaTurno instanceof Date
        ? turno.fechaTurno.toISOString().slice(0, 10)
        : String(turno.fechaTurno);

    return {
      idTurno: turno.idTurno,
      fechaTurno,
      horaTurno: turno.horaTurno,
      estadoTurno: turno.estadoTurno as string,
      socio: socioResponse,
      nutricionista: nutricionistaResponse,
    };
  }

  private async resolveSocioByUserId(userId: number): Promise<SocioOrmEntity> {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: ['persona'],
    });

    if (!usuario?.persona?.idPersona) {
      throw new NotFoundError('Usuario', String(userId));
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: usuario.persona.idPersona },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(usuario.persona.idPersona));
    }

    return socio;
  }
}
