import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AgendaSlotDto } from 'src/application/turnos/dtos/agenda-slot.dto';
import { GetAgendaDiariaQueryDto } from 'src/application/turnos/dtos/get-agenda-diaria-query.dto';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  formatArgentinaDate,
  getArgentinaWeekdayIndex,
  minutesToTime,
  parseArgentinaDateInput,
  timeToMinutes,
} from 'src/common/utils/argentina-datetime.util';
import {
  AgendaOrmEntity,
  TurnoOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Not, Repository } from 'typeorm';

@Injectable()
export class GetAgendaDiariaUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
  ) {}

  async execute(
    nutricionistaId: number,
    query: GetAgendaDiariaQueryDto,
  ): Promise<AgendaSlotDto[]> {
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { idPersona: nutricionistaId },
    });

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const fecha = parseArgentinaDateInput(query.fecha);
    const diaSemana = this.mapDateToDiaSemana(fecha);

    // 1. Obtener configuracion de agenda para ese dia
    const agendas = await this.agendaRepository.find({
      where: {
        nutricionista: { idPersona: nutricionistaId },
        dia: diaSemana,
      },
      order: { horaInicio: 'ASC' },
    });

    if (!agendas.length) {
      return []; // Dia sin agenda configurada
    }

    // 2. Obtener turnos existentes para ese dia
    const turnos = await this.turnoRepository.find({
      where: {
        nutricionista: { idPersona: nutricionistaId },
        fechaTurno: fecha,
        estadoTurno: Not(EstadoTurno.CANCELADO),
      },
      relations: ['socio'],
    });

    const turnosMap = new Map<string, TurnoOrmEntity>();
    turnos.forEach((t) => turnosMap.set(t.horaTurno.slice(0, 5), t));

    // 3. Generar slots
    const slots: AgendaSlotDto[] = [];

    for (const bloque of agendas) {
      let current = timeToMinutes(bloque.horaInicio);
      const end = timeToMinutes(bloque.horaFin);

      while (current + bloque.duracionTurno <= end) {
        const horaInicioStr = minutesToTime(current);
        const horaFinStr = minutesToTime(current + bloque.duracionTurno);

        const turnoExistente = turnosMap.get(horaInicioStr);

        const slot = new AgendaSlotDto();
        slot.horaInicio = horaInicioStr;
        slot.horaFin = horaFinStr;

        if (turnoExistente) {
          slot.estado = turnoExistente.estadoTurno;
          slot.turnoId = turnoExistente.idTurno;
          if (turnoExistente.socio) {
            slot.socio = {
              nombre: `${turnoExistente.socio.nombre} ${turnoExistente.socio.apellido}`,
              dni: turnoExistente.socio.dni ?? '',
            };
          }
        } else {
          slot.estado = 'LIBRE';
        }

        slots.push(slot);
        current += bloque.duracionTurno;
      }
    }

    return slots;
  }

  private mapDateToDiaSemana(date: Date): DiaSemana {
    const day = getArgentinaWeekdayIndex(date);
    const days = [
      DiaSemana.DOMINGO,
      DiaSemana.LUNES,
      DiaSemana.MARTES,
      DiaSemana.MIERCOLES,
      DiaSemana.JUEVES,
      DiaSemana.VIERNES,
      DiaSemana.SABADO,
    ];
    return days[day];
  }
}
