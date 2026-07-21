import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  ConflictError,
} from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  combineArgentinaDateAndTime,
  getArgentinaNow,
  getArgentinaStartOfToday,
  getArgentinaWeekdayIndex,
  timeToMinutes,
} from 'src/common/utils/argentina-datetime.util';
import {
  AgendaOrmEntity,
  NutricionistaOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';

/**
 * Helper compartido por `ReservarTurnoSocioUseCase` (CU-11) y
 * `AsignarTurnoManualUseCase` que concentra la pipeline canonica
 * de validaciones de la creacion de turno (reglas RB05, RB06, RB07,
 * RB17, RB27, RB28, RB40, RB58, RB59).
 *
 * El objetivo es evitar drift entre los dos use-cases: cualquier
 * cambio en las reglas comunes vive en un solo lugar.
 *
 * Metodos publicos:
 *  - `validarFechaHoraNoPasado(fecha, hora)`: valida fecha y hora
 *    con regla de anticipacion minima 1h. Variante usada por CU-11.
 *  - `validarFechaNoPasadoSimple(fecha)`: valida solo la fecha
 *    (sin chequeo de 1h). Variante usada por AsignarTurnoManual
 *    donde el staff puede agendar turnos para el mismo dia.
 *  - `validarAgendaDisponible(nutricionistaId, fecha, hora)`:
 *    valida que el slot este dentro de la agenda del nutri para
 *    el dia de la semana correspondiente.
 *  - `validarNoConflictoSlot(nutricionistaId, fecha, hora)`:
 *    valida que no exista otro turno activo (no cancelado) en el
 *    mismo slot del nutri.
 *
 * Lo que NO entra al helper (queda en cada use-case):
 *  - Validacion de RB14 (ficha completa) — depende del rol.
 *  - Validacion de scope de gimnasio — depende del actor.
 *  - Validacion de "reserva activa" del socio — es especifica de
 *    CU-11 (un staff puede agendar turnos para un socio que ya
 *    tiene otro activo con otro nutri, ver design seccion 4 paso 5).
 *  - Resolucion del socio/nutricionista — viene del flujo de cada
 *    use-case antes de invocar la pipeline.
 *
 * RBs: RB05, RB06, RB07, RB17, RB27, RB28, RB40, RB58, RB59.
 */
@Injectable()
export class ValidacionesCreacionTurno {
  constructor(
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Valida que la fecha del turno no sea anterior a hoy y, si es
   * hoy, que falte al menos 1h para la hora del turno.
   * Equivalente a `validateDateTimeNotInPast` de CU-11.
   */
  async validarFechaHoraNoPasado(
    fechaTurno: Date,
    horaTurno: string,
  ): Promise<void> {
    const today = getArgentinaStartOfToday();
    const now = getArgentinaNow();

    if (fechaTurno.getTime() < today.getTime()) {
      throw new BadRequestError(
        'No se puede reservar un turno en fechas pasadas.',
      );
    }

    if (fechaTurno.getTime() === today.getTime()) {
      const turnoDateTime = combineArgentinaDateAndTime(fechaTurno, horaTurno);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      if (turnoDateTime.getTime() < oneHourFromNow.getTime()) {
        throw new BadRequestError(
          'Los turnos deben reservarse con al menos 1 hora de anticipacion.',
        );
      }
    }
  }

  /**
   * Valida que la fecha del turno no sea anterior a hoy, sin
   * chequeo de anticipacion minima (variante usada por
   * AsignarTurnoManualUseCase donde el staff puede agendar turnos
   * para el mismo dia sin 1h de anticipacion).
   */
  async validarFechaNoPasadoSimple(fechaTurno: Date): Promise<void> {
    const todayStart = getArgentinaStartOfToday();

    if (fechaTurno.getTime() < todayStart.getTime()) {
      throw new BadRequestError(
        'No se puede asignar un turno en fechas pasadas.',
      );
    }
  }

  /**
   * Valida que el slot solicitado este dentro de la agenda del
   * nutricionista para ese dia. Equivalente a
   * `validateAgendaAvailability` de CU-11 y AsignarTurnoManual.
   */
  async validarAgendaDisponible(
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
        'El profesional no tiene disponibilidad configurada para ese dia.',
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

    const turnoInicio = timeToMinutes(horaTurno);

    const hasAvailableSlot = agendaDelDia.some((agenda) => {
      const inicio = timeToMinutes(agenda.horaInicio);
      const fin = timeToMinutes(agenda.horaFin);
      const turnoFin = turnoInicio + duracionTurno;

      return (
        turnoInicio >= inicio &&
        turnoFin <= fin &&
        (turnoInicio - inicio) % duracionTurno === 0
      );
    });

    if (!hasAvailableSlot) {
      throw new BadRequestError(
        'El horario seleccionado no coincide con la agenda disponible del profesional.',
      );
    }
  }

  /**
   * Valida que no exista otro turno activo (no cancelado) en el
   * mismo slot del nutricionista. Equivalente a
   * `findConflictingTurno` de CU-11. Lanza `ConflictError` si hay
   * conflicto.
   */
  async validarNoConflictoSlot(
    nutricionistaId: number,
    fechaTurno: Date,
    horaTurno: string,
  ): Promise<void> {
    const conflictingTurno = await this.turnoRepository.findOne({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
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
}
