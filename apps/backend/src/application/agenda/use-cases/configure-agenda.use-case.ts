import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ConfigureAgendaDto } from 'src/application/agenda/dtos/configure-agenda.dto';
import { ConfigureAgendaResponseDto } from 'src/application/agenda/dtos/configure-agenda-response.dto';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import {
  AGENDA_REPOSITORY,
  IAgendaRepository,
} from 'src/domain/entities/Agenda/agenda.repository';
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
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { SlotComputationService } from 'src/application/turnos/services/slot-computation.service';
import {
  formatArgentinaDate,
  getArgentinaStartOfToday,
  getArgentinaWeekdayIndex,
} from 'src/common/utils/argentina-datetime.util';

type TimeInterval = {
  start: number;
  end: number;
};

@Injectable()
export class ConfigureAgendaUseCase implements BaseUseCase {
  constructor(
    @Inject(AGENDA_REPOSITORY)
    private readonly agendaRepository: IAgendaRepository,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly slotComputationService: SlotComputationService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    payload: ConfigureAgendaDto,
  ): Promise<ConfigureAgendaResponseDto> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    if (nutricionista.fechaBaja) {
      throw new BadRequestError(
        'No se puede configurar la agenda de un profesional suspendido.',
      );
    }

    this.validateAgenda(payload);

    const agendaActual =
      await this.agendaRepository.findByNutricionistaId(nutricionistaId);
    const turnosFuturos = await this.findTurnosFuturos(nutricionistaId);
    const duracionActual =
      nutricionista.duracionTurnoMin ?? agendaActual[0]?.duracionTurno ?? 30;
    const turnosFueraDeAgenda = this.countTurnosFueraDeAgenda(
      turnosFuturos,
      payload.agendas,
    );
    const turnosConDuracionActual =
      payload.duracionTurno !== duracionActual ? turnosFuturos.length : 0;

    if (
      !payload.confirmarCambiosConTurnos &&
      (turnosFueraDeAgenda > 0 || turnosConDuracionActual > 0)
    ) {
      throw new ConflictError('La agenda tiene turnos futuros afectados.', {
        requiereConfirmacion: true,
        turnosFueraDeAgenda,
        turnosConDuracionActual,
      });
    }

    nutricionista.duracionTurnoMin = payload.duracionTurno;
    await this.nutricionistaRepository.update(nutricionistaId, nutricionista);

    const agendas = payload.agendas.map(
      (agenda) =>
        new AgendaEntity(
          null,
          agenda.dia,
          agenda.horaInicio,
          agenda.horaFin,
          payload.duracionTurno,
        ),
    );

    const configuredAgenda =
      await this.agendaRepository.replaceByNutricionistaId(
        nutricionistaId,
        agendas,
      );

    this.logger.log(
      `Agenda configurada para profesional ${nutricionistaId} con ${configuredAgenda.length} bloques.`,
    );

    const slotsDisponiblesProximos60Dias =
      await this.slotComputationService.contarSlotsProximos(
        nutricionistaId,
        60,
      );

    return {
      agendas: configuredAgenda.map((agenda) => ({
        idAgenda: agenda.idAgenda ?? 0,
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
        duracionTurno: agenda.duracionTurno,
      })),
      slotsDisponiblesProximos60Dias,
    };
  }

  private validateAgenda(payload: ConfigureAgendaDto): void {
    if (!payload.agendas?.length) {
      throw new BadRequestError(
        'Debe configurar al menos un dia y rango horario valido.',
      );
    }

    const intervalsByDay = new Map<DiaSemana, TimeInterval[]>();

    for (const agenda of payload.agendas) {
      const start = this.timeToMinutes(agenda.horaInicio);
      const end = this.timeToMinutes(agenda.horaFin);

      if (start >= end) {
        throw new BadRequestError(
          `El horario configurado para ${agenda.dia} es invalido.`,
        );
      }

      if (end - start < payload.duracionTurno) {
        throw new BadRequestError(
          `Con esta duración y los rangos definidos, el rango del día ${agenda.dia} no genera slots completos. Ajustá la duración o los rangos.`,
        );
      }

      const current = intervalsByDay.get(agenda.dia) ?? [];
      current.push({ start, end });
      intervalsByDay.set(agenda.dia, current);
    }

    for (const [day, intervals] of intervalsByDay.entries()) {
      const sortedIntervals = intervals.sort((a, b) => a.start - b.start);

      for (let index = 1; index < sortedIntervals.length; index++) {
        const previousInterval = sortedIntervals[index - 1];
        const currentInterval = sortedIntervals[index];

        if (currentInterval.start < previousInterval.end) {
          throw new BadRequestError(
            `Existen bloques horarios superpuestos para ${day}.`,
          );
        }
      }
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => Number(value));
    return hours * 60 + minutes;
  }

  private async findTurnosFuturos(
    nutricionistaId: number,
  ): Promise<TurnoOrmEntity[]> {
    const today = formatArgentinaDate(getArgentinaStartOfToday());
    const turnos = await this.turnoRepository.find({
      where: {
        nutricionista: { idPersona: nutricionistaId },
        estadoTurno: Not(EstadoTurno.CANCELADO),
      },
      relations: ['nutricionista'],
    });

    return turnos.filter(
      (turno) => formatArgentinaDate(turno.fechaTurno) >= today,
    );
  }

  private countTurnosFueraDeAgenda(
    turnos: TurnoOrmEntity[],
    agendas: ConfigureAgendaDto['agendas'],
  ): number {
    return turnos.filter((turno) => {
      const diaTurno = this.mapDateToDiaSemana(turno.fechaTurno);
      const horaTurno = this.timeToMinutes(turno.horaTurno.slice(0, 5));

      return !agendas.some((agenda) => {
        if (agenda.dia !== diaTurno) return false;
        const inicio = this.timeToMinutes(agenda.horaInicio);
        const fin = this.timeToMinutes(agenda.horaFin);
        return horaTurno >= inicio && horaTurno < fin;
      });
    }).length;
  }

  private mapDateToDiaSemana(date: Date): DiaSemana {
    const days = [
      DiaSemana.DOMINGO,
      DiaSemana.LUNES,
      DiaSemana.MARTES,
      DiaSemana.MIERCOLES,
      DiaSemana.JUEVES,
      DiaSemana.VIERNES,
      DiaSemana.SABADO,
    ];
    return days[getArgentinaWeekdayIndex(date)];
  }
}
