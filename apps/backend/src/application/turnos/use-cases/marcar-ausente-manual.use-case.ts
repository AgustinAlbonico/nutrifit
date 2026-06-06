import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  MarcarAusenteManualDto,
  TurnoOperacionResponseDto,
} from 'src/application/turnos/dtos';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  formatArgentinaDate,
  normalizeTimeToHHmm,
} from 'src/common/utils/argentina-datetime.util';

@Injectable()
export class MarcarAusenteManualUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly auditoriaService: AuditoriaService,
    private readonly notificacionesService: NotificacionesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    turnoId: number,
    payload: MarcarAusenteManualDto,
  ): Promise<TurnoOperacionResponseDto> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        socio: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    // RB13 + RB25: validar ownership segun rol
    const actorPersonaId = this.tenantContext.personaId;
    const actorRol = this.tenantContext.rol as Rol | null;

    const esPropietario =
      actorPersonaId != null &&
      turno.nutricionista?.idPersona === actorPersonaId;

    const esRolPermitido =
      actorRol != null &&
      (actorRol === Rol.RECEPCIONISTA || actorRol === Rol.ADMIN);

    if (!esPropietario && !esRolPermitido) {
      throw new ForbiddenError(
        'No tiene permisos para marcar ausente este turno.',
      );
    }

    // Validar estado actual
    if (
      turno.estadoTurno !== EstadoTurno.PROGRAMADO &&
      turno.estadoTurno !== EstadoTurno.PRESENTE
    ) {
      throw new ConflictError(
        `Solo se puede marcar ausente un turno en estado PROGRAMADO o PRESENTE. Estado actual: ${turno.estadoTurno}`,
      );
    }

    const estadoAnterior = turno.estadoTurno;
    turno.estadoTurno = EstadoTurno.AUSENTE;
    turno.ausenteAt = new Date();
    turno.ausenteMotivo = payload.motivo;

    const turnoActualizado = await this.turnoRepository.save(turno);

    await this.auditoriaService.registrar({
      accion: AccionAuditoria.MANUAL_ABSENT,
      entidad: 'Turno',
      entidadId: turnoId,
      metadata: {
        estadoAnterior,
        estadoNuevo: EstadoTurno.AUSENTE,
        motivo: payload.motivo,
        nutricionistaId: turno.nutricionista?.idPersona ?? null,
        socioId: turno.socio?.idPersona ?? null,
      },
    });

    if (turno.socio?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.socio.idPersona,
        tipo: TipoNotificacion.TURNO_AUSENTE,
        titulo: 'Tu turno fue marcado como ausente',
        mensaje: `El profesional marcó tu turno del ${formatArgentinaDate(turno.fechaTurno)} a las ${normalizeTimeToHHmm(turno.horaTurno)} como ausente. Motivo: ${payload.motivo}`,
        metadata: { turnoId, motivo: payload.motivo },
      });
    }

    return this.toResponseDto(turnoActualizado);
  }

  private toResponseDto(turno: TurnoOrmEntity): TurnoOperacionResponseDto {
    const response = new TurnoOperacionResponseDto();
    response.idTurno = turno.idTurno;
    response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
    response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
    response.estadoTurno = turno.estadoTurno;
    response.socioId = turno.socio?.idPersona ?? 0;
    response.nutricionistaId = turno.nutricionista?.idPersona ?? 0;
    return response;
  }
}
