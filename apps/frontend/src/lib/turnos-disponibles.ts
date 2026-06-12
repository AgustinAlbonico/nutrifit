export type EstadoTurnoDisponible = 'LIBRE' | 'OCUPADO';

export interface TurnoDisponible {
  horaInicio: string;
  horaFin: string;
  estado: EstadoTurnoDisponible;
}

/**
 * Deduplica una lista de slots por `horaInicio`.
 * - Si el mismo slot aparece en LIBRE y OCUPADO, gana LIBRE.
 * - Conserva la primera aparición de cada horaInicio.
 * - Devuelve el resultado ordenado por `horaInicio` ascendente.
 */
export const deduplicarTurnos = (
  turnos: TurnoDisponible[],
): TurnoDisponible[] => {
  const mapa = new Map<string, TurnoDisponible>();

  for (const turno of turnos) {
    const existente = mapa.get(turno.horaInicio);
    if (!existente) {
      mapa.set(turno.horaInicio, turno);
      continue;
    }

    if (existente.estado === 'OCUPADO' && turno.estado === 'LIBRE') {
      mapa.set(turno.horaInicio, turno);
    }
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.horaInicio.localeCompare(b.horaInicio),
  );
};
