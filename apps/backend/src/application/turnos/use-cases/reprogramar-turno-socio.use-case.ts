import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  POLITICA_OPERATIVA_REPOSITORY,
  IPoliticaOperativaRepository,
} from 'src/application/politicas/politica-operativa.repository';
import {
  ReprogramarTurnoSocioDto,
  TurnoOperacionResponseDto,
} from 'src/application/turnos/dtos';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  combineArgentinaDateAndTime,
  formatArgentinaDate,
  getArgentinaNow,
  getArgentinaStartOfToday,
  getArgentinaWeekdayIndex,
  normalizeTimeToHHmm,
  parseArgentinaDateInput,
} from 'src/common/utils/argentina-datetime.util';
import {
  AgendaOrmEntity,
  NutricionistaOrmEntity,
  SocioOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Not, Repository } from 'typeorm';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class ReprogramarTurnoSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    @Inject(POLITICA_OPERATIVA_REPOSITORY)
    private readonly politicaRepository: IPoliticaOperativaRepository,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    userId: number,
    turnoId: number,
    payload: ReprogramarTurnoSocioDto,
    opciones?: { esStaff?: boolean },
  ): Promise<TurnoOperacionResponseDto> {
    const esStaff = opciones?.esStaff ?? false;

    let socio: SocioOrmEntity | null = null;

    if (!esStaff) {
      socio = await this.resolveSocioByUserId(userId);
    }

    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        socio: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: {
        socio: { usuario: true },
        nutricionista: { usuario: true },
      },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    if (!esStaff) {
      if (turno.socio.idPersona !== socio!.idPersona) {
        throw new ForbiddenError(
          'No tiene permisos para reprogramar este turno.',
        );
      }
    }

    if (turno.estadoTurno !== EstadoTurno.CONFIRMADO) {
      throw new BadRequestError(
        'Solo se pueden reprogramar turnos en estado CONFIRMADO.',
      );
    }

    if (!esStaff) {
      await this.validateReprogramacionesLimit(turno.socio.idPersona ?? 0);
    }

    await this.validatePolicyRule(turno);

    const nuevaFecha = parseArgentinaDateInput(payload.fechaTurno);
    const nuevaHora = normalizeTimeToHHmm(payload.horaTurno);
    this.validateDateTimeNotInPast(nuevaFecha, nuevaHora);

    await this.validateAgendaAvailability(
      turno.nutricionista.idPersona ?? 0,
      nuevaFecha,
      nuevaHora,
    );

    const conflictingTurno = await this.turnoRepository.findOne({
      where: {
        idTurno: Not(turno.idTurno),
        nutricionista: {
          idPersona: turno.nutricionista.idPersona ?? 0,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        fechaTurno: nuevaFecha,
        horaTurno: nuevaHora,
        estadoTurno: Not(EstadoTurno.CANCELADO),
      },
    });

    if (conflictingTurno) {
      throw new ConflictError(
        'No hay disponibilidad en el nuevo horario seleccionado.',
      );
    }

    // Store original date for audit before updating
    const fechaOriginalAnterior = turno.fechaOriginal;
    turno.fechaOriginal = turno.fechaTurno;
    turno.fechaTurno = nuevaFecha;
    turno.horaTurno = nuevaHora;
    // La reprogramación mantiene el estado CONFIRMADO (el turno sigue confirmado, solo cambia fecha/hora)

    const updatedTurno = await this.turnoRepository.save(turno);

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: AccionAuditoria.TURNO_ESTADO_CAMBIO,
      entidad: 'Turno',
      entidadId: turnoId,
      metadata: {
        tipo: 'REPROGRAMACION',
        fechaOriginal: fechaOriginalAnterior
          ? formatArgentinaDate(fechaOriginalAnterior)
          : null,
        fechaNueva: formatArgentinaDate(nuevaFecha),
        horaOriginal: normalizeTimeToHHmm(updatedTurno.horaTurno),
        horaNueva: nuevaHora,
        motivo: payload.motivo ?? null,
      },
    });

    if (turno.socio.usuario?.idUsuario != null) {
      await this.notificacionesService.crear({
        destinatarioId: turno.socio.usuario.idUsuario,
        tipo: TipoNotificacion.TURNO_REPROGRAMADO,
        titulo: 'Turno reprogramado',
        mensaje: `Tu turno fue reprogramado para el ${formatArgentinaDate(updatedTurno.fechaTurno)} a las ${normalizeTimeToHHmm(updatedTurno.horaTurno)}.`,
        metadata: { turnoId: updatedTurno.idTurno },
      });
    }

    if (turno.nutricionista.usuario?.idUsuario != null) {
      const tituloNotif = esStaff
        ? 'Turno reprogramado por el staff'
        : 'Turno reprogramado por socio';
      const mensajeNotif = esStaff
        ? `El turno #${turno.idTurno} fue reprogramado por el staff para el ${formatArgentinaDate(updatedTurno.fechaTurno)} a las ${normalizeTimeToHHmm(updatedTurno.horaTurno)}.`
        : `El socio reprogramó el turno #${turno.idTurno} para el ${formatArgentinaDate(updatedTurno.fechaTurno)} a las ${normalizeTimeToHHmm(updatedTurno.horaTurno)}.`;

      await this.notificacionesService.crear({
        destinatarioId: turno.nutricionista.usuario.idUsuario,
        tipo: TipoNotificacion.TURNO_REPROGRAMADO,
        titulo: tituloNotif,
        mensaje: mensajeNotif,
        metadata: { turnoId: updatedTurno.idTurno },
      });
    }

    const actorLabel = esStaff ? 'staff' : 'socio';
    this.logger.log(
      `Turno ${turnoId} reprogramado por ${actorLabel} usuario=${userId}.`,
    );

    return this.toResponseDto(updatedTurno);
  }

  private async resolveSocioByUserId(userId: number): Promise<SocioOrmEntity> {
    const user = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: {
        persona: true,
      },
    });

    const personaId = user?.persona?.idPersona;

    if (!personaId) {
      throw new ForbiddenError(
        'El usuario autenticado no tiene un socio asociado.',
      );
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: personaId },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(personaId));
    }

    return socio;
  }

  private async validatePolicyRule(turno: TurnoOrmEntity): Promise<void> {
    const gimnasioId = turno.gimnasio?.idGimnasio ?? 1;
    const plazoHoras =
      await this.politicaRepository.getPlazoReprogramacion(gimnasioId);
    const scheduledDate = combineArgentinaDateAndTime(
      turno.fechaTurno,
      turno.horaTurno,
    );
    const now = new Date();
    const hoursDiff =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < plazoHoras) {
      throw new BadRequestError(
        `Solo se puede reprogramar con al menos ${plazoHoras} horas de anticipacion.`,
      );
    }
  }

  private async validateReprogramacionesLimit(
    socioIdPersona: number,
  ): Promise<void> {
    const gimnasioId = this.tenantContext.gimnasioId;
    const usuarioSocioId = await this.resolveUsuarioIdBySocioId(socioIdPersona);

    if (!usuarioSocioId) {
      // Si no hay usuario asociado (caso raro), no bloqueamos por el límite,
      // pero los siguientes chequeos del flujo van a fallar de forma más clara.
      return;
    }

    const reprogramaciones =
      await this.auditoriaService.contarReprogramacionesSocioEnMes(
        usuarioSocioId,
        gimnasioId,
        new Date(),
      );

    if (reprogramaciones >= 3) {
      throw new ConflictError(
        'Alcanzaste el límite de 3 reprogramaciones en el mes. Esperá al próximo mes para reprogramar.',
      );
    }
  }

  private async resolveUsuarioIdBySocioId(
    socioIdPersona: number,
  ): Promise<number | null> {
    const usuario = await this.usuarioRepository.findOne({
      where: { persona: { idPersona: socioIdPersona } },
    });
    return usuario?.idUsuario ?? null;
  }

  private async validateAgendaAvailability(
    nutricionistaId: number,
    fechaTurno: Date,
    horaTurno: string,
  ): Promise<void> {
    const diaSemana = this.mapDateToDiaSemana(fechaTurno);

    const agendaDelDia = await this.agendaRepository.find({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        dia: diaSemana,
      },
      order: { horaInicio: 'ASC' },
    });

    if (!agendaDelDia.length) {
      throw new BadRequestError(
        'El profesional no tiene disponibilidad para la nueva fecha seleccionada.',
      );
    }

    const nutricionista = await this.nutricionistaRepository.findOne({
      where: {
        idPersona: nutricionistaId,
        gimnasioId: this.tenantContext.gimnasioId,
      },
      select: ['idPersona', 'duracionTurnoMin'],
    });
    const duracionTurno =
      nutricionista?.duracionTurnoMin ?? agendaDelDia[0].duracionTurno;

    const turnoInicio = this.timeToMinutes(horaTurno);

    const hasAvailableSlot = agendaDelDia.some((agenda) => {
      const inicio = this.timeToMinutes(agenda.horaInicio);
      const fin = this.timeToMinutes(agenda.horaFin);
      const turnoFin = turnoInicio + duracionTurno;

      return (
        turnoInicio >= inicio &&
        turnoFin <= fin &&
        (turnoInicio - inicio) % duracionTurno === 0
      );
    });

    if (!hasAvailableSlot) {
      throw new BadRequestError(
        'El nuevo horario no coincide con la agenda disponible del profesional.',
      );
    }
  }

  private validateDateTimeNotInPast(fechaTurno: Date, horaTurno: string): void {
    const today = getArgentinaStartOfToday();
    const now = getArgentinaNow();

    // Validar que la fecha no sea anterior a hoy
    if (fechaTurno.getTime() < today.getTime()) {
      throw new BadRequestError('No se puede reprogramar a una fecha pasada.');
    }

    // Si es hoy, validar que falte al menos 1 hora
    if (fechaTurno.getTime() === today.getTime()) {
      const [hours, minutes] = horaTurno.split(':').map((v) => Number(v));
      const turnoDateTime = new Date(now);
      turnoDateTime.setHours(hours, minutes, 0, 0);

      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      if (turnoDateTime < oneHourFromNow) {
        throw new BadRequestError(
          'Los turnos deben reprogramarse con al menos 1 hora de anticipación.',
        );
      }
    }
  }

  private mapDateToDiaSemana(date: Date): DiaSemana {
    const day = getArgentinaWeekdayIndex(date);

    switch (day) {
      case 0:
        return DiaSemana.DOMINGO;
      case 1:
        return DiaSemana.LUNES;
      case 2:
        return DiaSemana.MARTES;
      case 3:
        return DiaSemana.MIERCOLES;
      case 4:
        return DiaSemana.JUEVES;
      case 5:
        return DiaSemana.VIERNES;
      case 6:
        return DiaSemana.SABADO;
      default:
        throw new BadRequestError('Dia de semana invalido.');
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => Number(value));
    return hours * 60 + minutes;
  }

  private toResponseDto(turno: TurnoOrmEntity): TurnoOperacionResponseDto {
    const response = new TurnoOperacionResponseDto();
    response.idTurno = turno.idTurno;
    response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
    response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
    response.estadoTurno = turno.estadoTurno;
    response.socioId = turno.socio.idPersona ?? 0;
    response.nutricionistaId = turno.nutricionista.idPersona ?? 0;
    response.gimnasioId = turno.gimnasio?.idGimnasio;
    response.fechaOriginal = turno.fechaOriginal
      ? formatArgentinaDate(turno.fechaOriginal)
      : undefined;
    return response;
  }
}
