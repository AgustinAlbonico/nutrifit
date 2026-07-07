export const DURACION_MAXIMA_GENERACION_PLAN_IA_MS = 60 * 60 * 1000;

export const MENSAJE_GENERACION_PLAN_IA_VENCIDA =
  'La generación venció por tiempo máximo';

export const ERROR_GENERACION_PLAN_IA_VENCIDA =
  'La generación quedó pendiente después de una interrupción. Podés iniciar una nueva generación.';

export function obtenerFechaCorteGeneracionPlanIaVencida(): Date {
  return new Date(Date.now() - DURACION_MAXIMA_GENERACION_PLAN_IA_MS);
}
