import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConfigureAgendaDto } from 'src/application/agenda/dtos/configure-agenda.dto';
import { ConfigureAgendaResponseDto } from 'src/application/agenda/dtos/configure-agenda-response.dto';
import { SlotComputationService } from 'src/application/turnos/services/slot-computation.service';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  formatArgentinaDate,
  getArgentinaTodayDate,
  getArgentinaWeekdayIndex,
  timeToMinutes,
} from 'src/common/utils/argentina-datetime.util';
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
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';

type IntervaloHorario = {
  start: number;
  end: number;
};

type AdvertenciaDisponibilidad = {
  requiereConfirmacion: true;
  turnosFueraDeAgenda: number;
  turnosConDuracionActual: number;
};

const DIAS_ARGENTINA: DiaSemana[] = [
  DiaSemana.DOMINGO,
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
];

const ESTADOS_NO_RESERVADOS = new Set<EstadoTurno>([
  EstadoTurno.CANCELADO,
  EstadoTurno.REALIZADO,
  EstadoTurno.AUSENTE,
]);

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

    const agendaActual =
      await this.agendaRepository.findByNutricionistaId(nutricionistaId);

    this.validateAgenda(payload);

    const turnosFuturosReservados =
      await this.obtenerTurnosFuturosReservados(nutricionistaId);
    const duracionActual =
      nutricionista.duracionTurnoMin ?? agendaActual[0]?.duracionTurno ?? 30;
    const advertencia = this.calcularAdvertenciaCambios(
      payload,
      turnosFuturosReservados,
      duracionActual,
    );

    if (advertencia && !payload.confirmarCambiosConTurnos) {
      throw new ConflictError(
        'Se requiere confirmación para guardar cambios que afectan turnos futuros.',
        advertencia,
      );
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

    const intervalsByDay = new Map<DiaSemana, IntervaloHorario[]>();

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

  private async obtenerTurnosFuturosReservados(
    nutricionistaId: number,
  ): Promise<TurnoOrmEntity[]> {
    const turnos = await this.turnoRepository.find({
      where: {
        nutricionista: { idPersona: nutricionistaId },
      },
      relations: {
        socio: true,
      },
    });

    const hoy = getArgentinaTodayDate();

    return turnos.filter((turno) => {
      if (!turno.socio) {
        return false;
      }

      if (ESTADOS_NO_RESERVADOS.has(turno.estadoTurno)) {
        return false;
      }

      return formatArgentinaDate(turno.fechaTurno) >= hoy;
    });
  }

  private calcularAdvertenciaCambios(
    payload: ConfigureAgendaDto,
    turnosFuturosReservados: TurnoOrmEntity[],
    duracionActual: number,
  ): AdvertenciaDisponibilidad | null {
    if (turnosFuturosReservados.length === 0) {
      return null;
    }

    const turnosFueraDeAgenda = turnosFuturosReservados.filter(
      (turno) =>
        !this.estaCubiertoPorNuevaAgenda(
          turno,
          payload.agendas,
          duracionActual,
        ),
    ).length;
    const turnosConDuracionActual =
      duracionActual !== payload.duracionTurno
        ? turnosFuturosReservados.length
        : 0;

    if (turnosFueraDeAgenda === 0 && turnosConDuracionActual === 0) {
      return null;
    }

    return {
      requiereConfirmacion: true,
      turnosFueraDeAgenda,
      turnosConDuracionActual,
    };
  }

  private estaCubiertoPorNuevaAgenda(
    turno: TurnoOrmEntity,
    agendas: ConfigureAgendaDto['agendas'],
    duracionActual: number,
  ): boolean {
    const diaTurno = DIAS_ARGENTINA[getArgentinaWeekdayIndex(turno.fechaTurno)];
    const inicioTurno = this.timeToMinutes(turno.horaTurno.slice(0, 5));
    const finTurno = inicioTurno + duracionActual;

    return agendas.some((agenda) => {
      if (agenda.dia !== diaTurno) {
        return false;
      }

      const inicioAgenda = this.timeToMinutes(agenda.horaInicio);
      const finAgenda = this.timeToMinutes(agenda.horaFin);

      return inicioTurno >= inicioAgenda && finTurno <= finAgenda;
    });
  }

  private timeToMinutes(time: string): number {
    return timeToMinutes(time);
  }
}
