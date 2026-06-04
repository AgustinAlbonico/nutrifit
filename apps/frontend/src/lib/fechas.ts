/**
 * Helpers de formato de fecha para la ficha de salud.
 *
 * - `formatFechaCorta`: formato "DD/MM/YYYY HH:mm" en hora local.
 *   Acepta `string | Date | null | undefined`. Devuelve "desconocida" si el valor es null/undefined.
 *
 * Diferencia con `lib/fechasArgentina.ts`: este helper incluye hora y se usa
 * para banners de "Última edición". `formatearFechaArgentinaCorta` solo trae
 * día/mes/año y se usa en inputs.
 */

const MENSAJE_FECHA_DESCONOCIDA = 'desconocida';

export function formatFechaCorta(
  fecha: string | Date | null | undefined,
): string {
  if (!fecha) {
    return MENSAJE_FECHA_DESCONOCIDA;
  }

  const fechaConvertida = fecha instanceof Date ? fecha : new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return MENSAJE_FECHA_DESCONOCIDA;
  }

  const dia = String(fechaConvertida.getDate()).padStart(2, '0');
  const mes = String(fechaConvertida.getMonth() + 1).padStart(2, '0');
  const anio = fechaConvertida.getFullYear();
  const horas = String(fechaConvertida.getHours()).padStart(2, '0');
  const minutos = String(fechaConvertida.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}
