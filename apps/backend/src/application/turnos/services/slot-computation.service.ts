import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';

import {
  AgendaOrmEntity,
  TurnoOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  EXCEPCION_DISPONIBILIDAD_REPOSITORY,
  ExcepcionDisponibilidadRepository,
} from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
import {
  getArgentinaNow,
  getArgentinaWeekdayIndex,
  combineArgentinaDateAndTime,
  timeToMinutes,
  minutesToTime,
  formatArgentinaDate,
} from 'src/common/utils/argentina-datetime.util';

export interface SlotDisponible {
  fechaHora: string; // ISO local Argentina
  disponible: boolean;
}

export interface DisponibilidadAmpliadaDto {
  nutricionistaId: number;
  duracionMin: number;
  slots: SlotDisponible[];
}

const ANTICIPACION_MIN_HORAS = 2;
const VENTANA_MAXIMA_DIAS = 60;
const ARGENTINA_DIAS: DiaSemana[] = [
  DiaSemana.DOMINGO,
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
];

@Injectable()
export class SlotComputationService {
  constructor(
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
    @Inject(EXCEPCION_DISPONIBILIDAD_REPOSITORY)
    private readonly excepcionRepository: ExcepcionDisponibilidadRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Calcula los slots disponibles para un nutricionista.
   * Ventana por defecto: now()+2h → now()+60d.
   * Excluye: ExcepcionDisponibilidad, turnos ocupados, slots < now+2h.
   */
  async calcularSlotsDisponibles(
    nutricionistaId: number,
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<DisponibilidadAmpliadaDto> {
    const ahora = getArgentinaNow();
    const limiteInferior = new Date(
      ahora.getTime() + ANTICIPACION_MIN_HORAS * 60 * 60 * 1000,
    );
    const limiteSuperior = new Date(
      ahora.getTime() + VENTANA_MAXIMA_DIAS * 24 * 60 * 60 * 1000,
    );

    const desde = fechaDesde ?? limiteInferior;
    const hasta = fechaHasta ?? limiteSuperior;

    if (desde < limiteInferior) {
      throw new BadRequestError(
        'La fecha desde no puede ser anterior a 2 horas desde ahora.',
      );
    }
    if (hasta > limiteSuperior) {
      throw new BadRequestError(
        'La fecha hasta no puede superar los 60 días desde ahora.',
      );
    }
    if (desde >= hasta) {
      throw new BadRequestError('fechaDesde debe ser anterior a fechaHasta.');
    }

    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { idPersona: nutricionistaId },
    });
    if (!nutricionista) {
      return { nutricionistaId, duracionMin: 0, slots: [] };
    }

    const bloques = await this.agendaRepository.find({
      where: {
        nutricionista: { idPersona: nutricionistaId },
      },
    });
    if (bloques.length === 0) {
      return { nutricionistaId, duracionMin: 0, slots: [] };
    }

    const duracionMin = bloques[0].duracionTurno;

    const excepciones = await this.excepcionRepository.findVigentesEnVentana(
      nutricionistaId,
      desde,
      hasta,
    );

    const turnosOcupados = await this.turnoRepository.find({
      where: {
        nutricionista: { idPersona: nutricionistaId },
        estadoTurno: Not(EstadoTurno.CANCELADO),
      },
    });

    const fechaTurnoDesde = formatArgentinaDate(desde);
    const fechaTurnoHasta = formatArgentinaDate(hasta);
    const mapaOcupados = new Map<string, TurnoOrmEntity>();
    for (const turno of turnosOcupados) {
      const fechaStr = formatArgentinaDate(turno.fechaTurno);
      if (fechaStr < fechaTurnoDesde || fechaStr > fechaTurnoHasta) {
        continue;
      }
      const horaStr = turno.horaTurno.slice(0, 5);
      const clave = `${fechaStr} ${horaStr}`;
      mapaOcupados.set(clave, turno);
    }

    const slots: SlotDisponible[] = [];
    const inicioMs = new Date(
      `${formatArgentinaDate(desde)}T00:00:00-03:00`,
    ).getTime();
    const finMs = new Date(
      `${formatArgentinaDate(hasta)}T00:00:00-03:00`,
    ).getTime();

    for (let cursorMs = inicioMs; cursorMs <= finMs; cursorMs += 86400000) {
      const cursor = new Date(cursorMs);
      const diaSemanaIdx = getArgentinaWeekdayIndex(cursor);
      const diaSemana = ARGENTINA_DIAS[diaSemanaIdx];
      const bloquesDelDia = bloques.filter((b) => b.dia === diaSemana);
      const fechaStr = formatArgentinaDate(cursor);

      for (const bloque of bloquesDelDia) {
        const inicioMin = timeToMinutes(bloque.horaInicio);
        const finMin = timeToMinutes(bloque.horaFin);

        for (
          let current = inicioMin;
          current + duracionMin <= finMin;
          current += duracionMin
        ) {
          const slotInicio = combineArgentinaDateAndTime(
            cursor,
            minutesToTime(current),
          );
          const slotFin = new Date(
            slotInicio.getTime() + duracionMin * 60 * 1000,
          );

          if (slotInicio < desde || slotInicio > hasta) {
            continue;
          }

          // Regla RB07: anticipación mínima 2h
          if (slotInicio < limiteInferior) {
            continue;
          }

          // Excluir si cae en una ExcepcionDisponibilidad
          const caeEnExcepcion = excepciones.some(
            (e) => slotInicio < e.fechaFin && slotFin > e.fechaInicio,
          );
          if (caeEnExcepcion) {
            continue;
          }

          // Excluir si está ocupado
          const horaStr = minutesToTime(current);
          const clave = `${fechaStr} ${horaStr}`;
          if (mapaOcupados.has(clave)) {
            continue;
          }

          slots.push({
            fechaHora: slotInicio.toISOString(),
            disponible: true,
          });
        }
      }
    }

    return {
      nutricionistaId,
      duracionMin,
      slots,
    };
  }

  /**
   * Cuenta cuántos slots hay disponibles en los próximos N días.
   */
  async contarSlotsProximos(
    nutricionistaId: number,
    dias: number = 7,
  ): Promise<number> {
    const desde = getArgentinaNow();
    const hasta = new Date(desde.getTime() + dias * 86400000);
    const resultado = await this.calcularSlotsDisponibles(
      nutricionistaId,
      desde,
      hasta,
    );
    return resultado.slots.length;
  }
}
