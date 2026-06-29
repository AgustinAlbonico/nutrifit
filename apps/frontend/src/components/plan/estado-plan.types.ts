/**
 * Tipo que representa el estado computado de un plan de alimentación en la UI.
 *
 * El backend guarda `activo: boolean` y `finalizadoAt: Date | null`. Acá
 * derivamos un estado legible (`BORRADOR`, `ACTIVO`, `FINALIZADO`) que
 * luego se mapea a color y copy en `EstadoPlanBadge`.
 */
export type EstadoPlanVisual = 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';

export interface PropiedadesDerivacionEstado {
  activo: boolean;
  finalizadoAt: string | Date | null;
}

export function derivarEstadoPlan({
  activo,
  finalizadoAt,
}: PropiedadesDerivacionEstado): EstadoPlanVisual {
  if (activo && finalizadoAt) return 'FINALIZADO';
  if (activo) return 'ACTIVO';
  return 'BORRADOR';
}
