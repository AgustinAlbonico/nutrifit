const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';
const ARGENTINA_UTC_OFFSET = '-03:00';

function getPart(parts: Intl.DateTimeFormatPart[], type: string): string {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`No se pudo resolver la parte ${type} de la fecha.`);
  }

  return value;
}

function resolveDateInput(dateValue: Date | string): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const parsedDate = new Date(`${dateValue}T00:00:00${ARGENTINA_UTC_OFFSET}`);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Fecha invalida recibida: ${dateValue}`);
  }

  return parsedDate;
}

export function normalizeTimeToHHmm(time: string): string {
  const [hours = '00', minutes = '00'] = time.split(':');

  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

export function formatArgentinaDate(date: Date | string): string {
  const safeDate = resolveDateInput(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(safeDate);
  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');

  return `${year}-${month}-${day}`;
}

export function formatArgentinaTimeHHmm(date: Date | string): string {
  const safeDate = resolveDateInput(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(safeDate);
  const hour = getPart(parts, 'hour');
  const minute = getPart(parts, 'minute');

  return `${hour}:${minute}`;
}

export function formatArgentinaDateTime(date: Date | string): string {
  return `${formatArgentinaDate(date)} ${formatArgentinaTimeHHmm(date)}`;
}

export function parseArgentinaDateInput(dateValue: string): Date {
  return new Date(`${dateValue}T00:00:00${ARGENTINA_UTC_OFFSET}`);
}

export function combineArgentinaDateAndTime(
  dateValue: Date | string,
  timeValue: string,
): Date {
  const date = formatArgentinaDate(dateValue);
  const normalizedTime = normalizeTimeToHHmm(timeValue);

  return new Date(`${date}T${normalizedTime}:00${ARGENTINA_UTC_OFFSET}`);
}

export function getArgentinaTodayDate(
  referenceDate: Date = new Date(),
): string {
  return formatArgentinaDate(referenceDate);
}

export function getArgentinaStartOfToday(
  referenceDate: Date = new Date(),
): Date {
  return parseArgentinaDateInput(getArgentinaTodayDate(referenceDate));
}

export function getArgentinaWeekdayIndex(date: Date | string): number {
  const safeDate = resolveDateInput(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIMEZONE,
    weekday: 'short',
  });

  const weekday = formatter.format(safeDate);

  switch (weekday) {
    case 'Sun':
      return 0;
    case 'Mon':
      return 1;
    case 'Tue':
      return 2;
    case 'Wed':
      return 3;
    case 'Thu':
      return 4;
    case 'Fri':
      return 5;
    case 'Sat':
      return 6;
    default:
      throw new Error(
        'No se pudo resolver el dia de la semana para Argentina.',
      );
  }
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map((val) => Number(val));
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Obtiene la fecha y hora actual de Argentina como objeto Date
 */
export function getArgentinaNow(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');
  const hour = getPart(parts, 'hour');
  const minute = getPart(parts, 'minute');
  const second = getPart(parts, 'second');

  return new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}${ARGENTINA_UTC_OFFSET}`,
  );
}
