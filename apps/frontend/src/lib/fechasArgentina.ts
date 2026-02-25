const ZONA_HORARIA_ARGENTINA = 'America/Argentina/Buenos_Aires';

function obtenerParte(
  partes: Intl.DateTimeFormatPart[],
  tipo: Intl.DateTimeFormatPartTypes,
): string {
  const parte = partes.find((item) => item.type === tipo)?.value;

  return parte ?? '';
}

function convertirAFecha(valor: string | Date): Date | null {
  const fecha = valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
}

export function formatearFechaArgentinaParaInput(
  valor: string | Date | null | undefined,
): string {
  if (!valor) {
    return '';
  }

  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor;
  }

  const fecha = convertirAFecha(valor);

  if (!fecha) {
    return '';
  }

  const formateador = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_ARGENTINA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const partes = formateador.formatToParts(fecha);
  const anio = obtenerParte(partes, 'year');
  const mes = obtenerParte(partes, 'month');
  const dia = obtenerParte(partes, 'day');

  return `${anio}-${mes}-${dia}`;
}

export function formatearFechaArgentinaCorta(
  valor: string | Date | null | undefined,
): string {
  if (!valor) {
    return '';
  }

  const fecha = convertirAFecha(valor);

  if (!fecha) {
    return '';
  }

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA_ARGENTINA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha);
}
