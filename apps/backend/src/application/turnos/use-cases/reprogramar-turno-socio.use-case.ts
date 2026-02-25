import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
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
  SocioOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Not, Repository } from 'typeorm';

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
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    userId: number,
    turnoId: number,
    payload: ReprogramarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    const socio = await this.resolveSocioByUserId(userId);

    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: {
        socio: true,
        nutricionista: true,
      },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    if (turno.socio.idPersona !== socio.idPersona) {
      throw new ForbiddenError(
        'No tiene permisos para reprogramar este turno.',
      );
    }

    if (turno.estadoTurno !== EstadoTurno.PENDIENTE) {
      throw new BadRequestError(
        'Solo se pueden reprogramar turnos en estado PENDIENTE.',
      );
    }

    this.validate24hRule(turno.fechaTurno, turno.horaTurno);

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
        nutricionista: { idPersona: turno.nutricionista.idPersona ?? 0 },
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

    turno.fechaTurno = nuevaFecha;
    turno.horaTurno = nuevaHora;
    turno.estadoTurno = EstadoTurno.REPROGRAMADO;

    const updatedTurno = await this.turnoRepository.save(turno);

    this.logger.log(
      `Turno ${turnoId} reprogramado por socio ${socio.idPersona}.`,
    );
    this.logger.log(
      `Notificacion interna pendiente de integracion para profesional ${turno.nutricionista.idPersona}.`,
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

  private validate24hRule(fechaTurno: Date, horaTurno: string): void {
    const scheduledDate = combineArgentinaDateAndTime(fechaTurno, horaTurno);
    const now = new Date();
    const hoursDiff =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      throw new BadRequestError(
        'Solo se puede reprogramar con al menos 24 horas de anticipacion.',
      );
    }
  }

  private async validateAgendaAvailability(
    nutricionistaId: number,
    fechaTurno: Date,
    horaTurno: string,
  ): Promise<void> {
    const diaSemana = this.mapDateToDiaSemana(fechaTurno);

    const agendaDelDia = await this.agendaRepository.find({
      where: {
        nutricionista: { idPersona: nutricionistaId },
        dia: diaSemana,
      },
      order: { horaInicio: 'ASC' },
    });

    if (!agendaDelDia.length) {
      throw new BadRequestError(
        'El profesional no tiene disponibilidad para la nueva fecha seleccionada.',
      );
    }

    const turnoInicio = this.timeToMinutes(horaTurno);

    const hasAvailableSlot = agendaDelDia.some((agenda) => {
      const inicio = this.timeToMinutes(agenda.horaInicio);
      const fin = this.timeToMinutes(agenda.horaFin);
      const turnoFin = turnoInicio + agenda.duracionTurno;

      return (
        turnoInicio >= inicio &&
        turnoFin <= fin &&
        (turnoInicio - inicio) % agenda.duracionTurno === 0
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
    return response;
  }
}
