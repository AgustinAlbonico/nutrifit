import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import {
  combineArgentinaDateAndTime,
  formatArgentinaDate,
  getArgentinaNow,
  getArgentinaTodayDate,
} from 'src/common/utils/argentina-datetime.util';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

export interface CheckInResult {
  success: boolean;
  estado: EstadoTurno;
  checkInAt: Date;
  llegadaTardeMin: number | null;
  fueIdempotente: boolean;
}

@Injectable()
export class CheckInTurnoUseCase {
  private static readonly MARGEN_TOLERANCIA_LLEGADA_TARDE_MIN = 0;

  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(turnoId: number): Promise<CheckInResult> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        nutricionista: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    // A3 — Idempotencia: si ya está PRESENTE, devolvemos el checkInAt
    // existente sin guardar ni auditar. Cubre el caso del doble click
    // y también la carrera con el scheduler de ausentes.
    if (turno.estadoTurno === EstadoTurno.PRESENTE) {
      return {
        success: true,
        estado: EstadoTurno.PRESENTE,
        checkInAt: turno.checkInAt as Date,
        llegadaTardeMin: turno.llegadaTardeMin,
        fueIdempotente: true,
      };
    }

    if (turno.estadoTurno !== EstadoTurno.CONFIRMADO) {
      throw new BadRequestError(
        `El turno no se puede marcar presente en su estado actual (${turno.estadoTurno}).`,
      );
    }

    // A1 — Validar que sea el día del turno en TZ Argentina.
    const hoy = getArgentinaTodayDate();
    const fechaTurnoStr = formatArgentinaDate(turno.fechaTurno);
    if (fechaTurnoStr !== hoy) {
      throw new BadRequestError(
        'Solo se puede hacer check-in de turnos del día actual.',
      );
    }

    // Calcular minutos de llegada tarde (solo si llega después del horario)
    const ahora = getArgentinaNow();
    const horaTurnoReal = combineArgentinaDateAndTime(
      turno.fechaTurno,
      turno.horaTurno,
    );
    const diffMinutos = Math.floor(
      (ahora.getTime() - horaTurnoReal.getTime()) / 60000,
    );

    // Snapshots para auditoría
    const antes = {
      estado: turno.estadoTurno,
      checkInAt: turno.checkInAt,
      llegadaTardeMin: turno.llegadaTardeMin,
    };

    turno.estadoTurno = EstadoTurno.PRESENTE;
    turno.checkInAt = ahora;
    if (diffMinutos > 0) {
      turno.llegadaTardeMin = diffMinutos;
    } else {
      turno.llegadaTardeMin = null;
    }

    const turnoActualizado = await this.turnoRepository.save(turno);

    // RB33 — Auditar con antes/despues
    await this.auditoriaService.registrar({
      accion: AccionAuditoria.CHECKIN,
      entidad: 'turno',
      entidadId: turnoActualizado.idTurno,
      metadata: {
        antes,
        despues: {
          estado: turnoActualizado.estadoTurno,
          checkInAt: turnoActualizado.checkInAt?.toISOString() ?? null,
          llegadaTardeMin: turnoActualizado.llegadaTardeMin,
        },
        ventana: { diffMinutos },
      },
      gimnasioId: this.tenantContext.gimnasioId,
    });

    // Notificación SOLO al nutricionista (el socio ya recibió TURNO_CONFIRMADO
    // al confirmar por email/token; el check-in es la confirmación silenciosa
    // para el profesional de que el socio llegó).
    if (turnoActualizado.nutricionista?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turnoActualizado.nutricionista.idPersona,
        tipo: TipoNotificacion.CHECK_IN,
        titulo: 'Socio realizó check-in',
        mensaje: `El socio hizo check-in para el turno #${turnoActualizado.idTurno}.`,
        metadata: { turnoId: turnoActualizado.idTurno },
      });
    }

    this.logger.log(
      `Check-in realizado para turno ${turnoActualizado.idTurno} (diffMinutos=${diffMinutos}).`,
    );

    return {
      success: true,
      estado: EstadoTurno.PRESENTE,
      checkInAt: ahora,
      llegadaTardeMin: turnoActualizado.llegadaTardeMin,
      fueIdempotente: false,
    };
  }
}
