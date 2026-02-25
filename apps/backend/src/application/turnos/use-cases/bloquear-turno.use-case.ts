import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { BloquearTurnoDto } from 'src/application/turnos/dtos/bloquear-turno.dto';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos/turno-operacion-response.dto';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
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
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Not, Repository } from 'typeorm';

@Injectable()
export class BloquearTurnoUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>,
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    payload: BloquearTurnoDto,
  ): Promise<TurnoOperacionResponseDto> {
    const nutricionista = await this.nutricionistaOrmRepository.findOne({
      where: { idPersona: nutricionistaId },
    });

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const fechaTurno = parseArgentinaDateInput(payload.fecha);
    const horaTurno = normalizeTimeToHHmm(payload.horaTurno);
    this.validateDateNotInPast(fechaTurno);

    // 1. Validar que el horario pertenezca a la agenda del profesional
    await this.validateAgendaAvailability(
      nutricionistaId,
      fechaTurno,
      horaTurno,
    );

    // 2. Verificar si ya existe un turno en ese horario (activo o bloqueado)
    const existingTurno = await this.turnoRepository.findOne({
      where: {
        nutricionista: { idPersona: nutricionistaId },
        fechaTurno,
        horaTurno,
        estadoTurno: Not(EstadoTurno.CANCELADO),
      },
      relations: ['socio'],
    });

    if (existingTurno) {
      if (existingTurno.estadoTurno === EstadoTurno.BLOQUEADO) {
        throw new ConflictError('El turno ya se encuentra bloqueado.');
      }
      throw new ConflictError(
        'El horario seleccionado ya tiene un turno reservado. Cancelelo primero para bloquear.',
      );
    }

    // 3. Crear turno bloqueado
    const turno = new TurnoOrmEntity();
    turno.fechaTurno = fechaTurno;
    turno.horaTurno = horaTurno;
    turno.estadoTurno = EstadoTurno.BLOQUEADO;
    turno.nutricionista = nutricionista;
    // turno.socio no se asigna porque es opcional en la entidad y null no es compatible directo si strictNullChecks está activo
    // Al ser opcional en la entidad, simplemente no la asignamos o la dejamos undefined

    const turnoBloqueado = await this.turnoRepository.save(turno);

    this.logger.log(
      `Turno bloqueado por profesional ${nutricionistaId}. Turno=${turnoBloqueado.idTurno}, fecha=${payload.fecha}, hora=${horaTurno}.`,
    );

    return this.toResponseDto(turnoBloqueado);
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
        'No tiene agenda configurada para el dia seleccionado.',
      );
    }

    const turnoInicio = this.timeToMinutes(horaTurno);

    const hasAvailableSlot = agendaDelDia.some((agenda) => {
      const inicio = this.timeToMinutes(agenda.horaInicio);
      const fin = this.timeToMinutes(agenda.horaFin);
      const turnoFin = turnoInicio + agenda.duracionTurno;

      // Validar que el inicio este dentro del rango y alineado con la duracion
      return (
        turnoInicio >= inicio &&
        turnoFin <= fin &&
        (turnoInicio - inicio) % agenda.duracionTurno === 0
      );
    });

    if (!hasAvailableSlot) {
      throw new BadRequestError(
        'El horario seleccionado no corresponde a un turno valido de su agenda.',
      );
    }
  }

  private validateDateNotInPast(fechaTurno: Date): void {
    const today = getArgentinaStartOfToday();

    if (fechaTurno.getTime() < today.getTime()) {
      throw new BadRequestError(
        'No se pueden bloquear turnos en fechas pasadas.',
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
    response.socioId = turno.socio?.idPersona ?? 0;
    response.nutricionistaId = turno.nutricionista?.idPersona ?? 0;
    return response;
  }
}
