import { describe, expect, it } from 'vitest';
import {
  construirMensajeConfirmacionDisponibilidad,
  crearPayloadDisponibilidad,
  obtenerDuracionGlobalAgenda,
  type AdvertenciaDisponibilidad,
} from './agendaDisponibilidad';

describe('agendaDisponibilidad', () => {
  it('obtiene una duracion global unica desde la agenda cargada', () => {
    const duracion = obtenerDuracionGlobalAgenda([
      {
        idAgenda: 1,
        dia: 'Lunes',
        horaInicio: '09:00:00',
        horaFin: '12:00:00',
        duracionTurno: 45,
      },
      {
        idAgenda: 2,
        dia: 'Miércoles',
        horaInicio: '14:00:00',
        horaFin: '18:00:00',
        duracionTurno: 45,
      },
    ]);

    expect(duracion).toBe(45);
  });

  it('crea el payload con duracion global y sin duracion por bloque', () => {
    const payload = crearPayloadDisponibilidad({
      duracionTurno: 30,
      agendas: [
        {
          id: 'uno',
          dia: 'Lunes',
          horaInicio: '09:00',
          horaFin: '12:00',
        },
      ],
      confirmarCambiosConTurnos: true,
    });

    expect(payload).toEqual({
      duracionTurno: 30,
      confirmarCambiosConTurnos: true,
      agendas: [
        {
          dia: 'Lunes',
          horaInicio: '09:00',
          horaFin: '12:00',
        },
      ],
    });
  });

  it('construye un mensaje combinado de confirmacion segun el spec', () => {
    const advertencia: AdvertenciaDisponibilidad = {
      requiereConfirmacion: true,
      turnosFueraDeAgenda: 2,
      turnosConDuracionActual: 3,
    };

    const mensaje = construirMensajeConfirmacionDisponibilidad(advertencia);

    expect(mensaje).toContain(
      'Este rango tiene 2 turnos reservados. Si lo eliminás, esos turnos quedarán fuera de la agenda configurada. ¿Continuar?',
    );
    expect(mensaje).toContain(
      'Hay 3 turnos futuros con la duración actual. Los nuevos slots se calcularán con la nueva duración. Los turnos existentes NO se modifican. ¿Continuar?',
    );
  });
});
