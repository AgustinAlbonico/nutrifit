import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ReservarTurnoSocioDto,
  TurnoOperacionResponseDto,
} from 'src/application/turnos/dtos';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
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

@Injectable()
export class ReservarTurnoSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>,
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    userId: number,
    payload: ReservarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    const socio = await this.resolveSocioByUserId(userId);

    if (!socio.fichaSalud) {
      throw new BadRequestError(
        'Debe completar su ficha de salud antes de reservar un turno.',
      );
    }

    const nutricionista = await this.nutricionistaRepository.findById(
      payload.nutricionistaId,
    );

    if (!nutricionista || nutricionista.fechaBaja) {
      throw new NotFoundError('Profesional', String(payload.nutricionistaId));
    }

    const fechaTurno = parseArgentinaDateInput(payload.fechaTurno);
    const horaTurno = normalizeTimeToHHmm(payload.horaTurno);
    this.validateDateTimeNotInPast(fechaTurno, horaTurno);

    await this.validateAgendaAvailability(
      payload.nutricionistaId,
      fechaTurno,
      horaTurno,
    );

    const existingSameDay = await this.turnoRepository.findOne({
      where: {
        socio: { idPersona: socio.idPersona ?? 0 },
        nutricionista: { idPersona: payload.nutricionistaId },
        fechaTurno,
        estadoTurno: Not(EstadoTurno.CANCELADO),
      },
    });

    if (existingSameDay) {
      throw new ConflictError(
        'Ya tiene un turno con este profesional para la fecha seleccionada.',
      );
    }

    const conflictingTurno = await this.turnoRepository.findOne({
      where: {
        nutricionista: { idPersona: payload.nutricionistaId },
        fechaTurno,
        horaTurno,
        estadoTurno: Not(EstadoTurno.CANCELADO),
      },
    });

    if (conflictingTurno) {
      throw new ConflictError(
        'El horario seleccionado ya fue reservado por otro socio.',
      );
    }

    const nutricionistaOrm = await this.nutricionistaOrmRepository.findOne({
      where: { idPersona: payload.nutricionistaId },
    });

    if (!nutricionistaOrm) {
      throw new NotFoundError('Profesional', String(payload.nutricionistaId));
    }

    const turno = new TurnoOrmEntity();
    turno.fechaTurno = fechaTurno;
    turno.horaTurno = horaTurno;
    turno.estadoTurno = EstadoTurno.PENDIENTE;
    turno.socio = socio;
    turno.nutricionista = nutricionistaOrm;

    const turnoCreado = await this.turnoRepository.save(turno);

    this.logger.log(
      `Turno reservado por socio ${socio.idPersona}. Turno=${turnoCreado.idTurno}, profesional=${payload.nutricionistaId}.`,
    );
    this.logger.log(
      `Notificacion interna pendiente de integracion para turno ${turnoCreado.idTurno}.`,
    );

    return this.toResponseDto(turnoCreado);
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
      relations: {
        fichaSalud: true,
      },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(personaId));
    }

    return socio;
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
        'El profesional no tiene disponibilidad configurada para ese dia.',
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
        'El horario seleccionado no coincide con la agenda disponible del profesional.',
      );
    }
  }

  private validateDateTimeNotInPast(fechaTurno: Date, horaTurno: string): void {
    const today = getArgentinaStartOfToday();
    const now = getArgentinaNow();

    // Validar que la fecha no sea anterior a hoy
    if (fechaTurno.getTime() < today.getTime()) {
      throw new BadRequestError(
        'No se puede reservar un turno en fechas pasadas.',
      );
    }

    // Si es hoy, validar que falte al menos 1 hora
    if (fechaTurno.getTime() === today.getTime()) {
      const [hours, minutes] = horaTurno.split(':').map((v) => Number(v));
      const turnoDateTime = new Date(now);
      turnoDateTime.setHours(hours, minutes, 0, 0);

      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      if (turnoDateTime < oneHourFromNow) {
        throw new BadRequestError(
          'Los turnos deben reservarse con al menos 1 hora de anticipación.',
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
