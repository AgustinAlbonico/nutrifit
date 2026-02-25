import { Inject, Injectable } from '@nestjs/common';
import { ConfigureAgendaDto } from 'src/application/agenda/dtos/configure-agenda.dto';
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
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

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
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    payload: ConfigureAgendaDto,
  ): Promise<AgendaEntity[]> {
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

    const agendas = payload.agendas.map(
      (agenda) =>
        new AgendaEntity(
          null,
          agenda.dia,
          agenda.horaInicio,
          agenda.horaFin,
          agenda.duracionTurno,
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

    return configuredAgenda;
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

      if (end - start < agenda.duracionTurno) {
        throw new BadRequestError(
          `La duracion del turno en ${agenda.dia} supera el rango horario disponible.`,
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
}
