import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AsignarTurnoManualDto } from 'src/application/turnos/dtos/asignar-turno-manual.dto';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos/turno-operacion-response.dto';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  formatArgentinaDate,
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
} from 'src/infrastructure/persistence/typeorm/entities';
import { Not, Repository } from 'typeorm';

@Injectable()
export class AsignarTurnoManualUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>,
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    payload: AsignarTurnoManualDto,
  ): Promise<TurnoOperacionResponseDto> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    if (nutricionista.fechaBaja) {
      throw new BadRequestError(
        'No se puede asignar turnos a un profesional suspendido.',
      );
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: payload.socioId },
      relations: { fichaSalud: true },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(payload.socioId));
    }

    // Validación: verificar que el paciente tenga ficha de salud cargada
    if (!socio.fichaSalud) {
      throw new BadRequestError(
        'El paciente debe completar su ficha de salud antes de reservar un turno.',
      );
    }

    const fechaTurno = parseArgentinaDateInput(payload.fechaTurno);
    const horaTurno = normalizeTimeToHHmm(payload.horaTurno);
    this.validateDateNotInPast(fechaTurno);

    await this.validateAgendaAvailability(
      nutricionistaId,
      fechaTurno,
      horaTurno,
    );

    const conflictingTurno = await this.turnoRepository.findOne({
      where: {
        nutricionista: { idPersona: nutricionistaId },
        fechaTurno,
        horaTurno,
        estadoTurno: Not(EstadoTurno.CANCELADO),
      },
    });

    if (conflictingTurno) {
      throw new ConflictError(
        'El horario seleccionado ya se encuentra ocupado para este profesional.',
      );
    }

    const nutricionistaOrm = await this.nutricionistaOrmRepository.findOne({
      where: { idPersona: nutricionistaId },
    });

    if (!nutricionistaOrm) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const turno = new TurnoOrmEntity();
    turno.fechaTurno = fechaTurno;
    turno.horaTurno = horaTurno;
    turno.estadoTurno = EstadoTurno.PROGRAMADO;
    turno.socio = socio;
    turno.nutricionista = nutricionistaOrm;

    const turnoCreado = await this.turnoRepository.save(turno);

    this.logger.log(
      `Turno manual asignado. Turno=${turnoCreado.idTurno}, profesional=${nutricionistaId}, socio=${payload.socioId}.`,
    );
    this.logger.log(
      `Notificacion interna pendiente de integracion para socio ${payload.socioId} por turno ${turnoCreado.idTurno}.`,
    );

    return this.toResponseDto(turnoCreado);
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
        'El profesional no tiene disponibilidad configurada para el dia seleccionado.',
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
        'El horario seleccionado no coincide con la disponibilidad del profesional.',
      );
    }
  }

  private validateDateNotInPast(fechaTurno: Date): void {
    const todayStart = getArgentinaStartOfToday();

    if (fechaTurno.getTime() < todayStart.getTime()) {
      throw new BadRequestError(
        'No se puede asignar un turno en fechas pasadas.',
      );
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
