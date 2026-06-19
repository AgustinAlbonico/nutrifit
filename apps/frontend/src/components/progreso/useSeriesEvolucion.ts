import { format, parseISO, subDays, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';

import type {
  HistorialMediciones,
  KpiEvolucion,
  MedicionHistorial,
  PuntoSeriePliegues,
  RangoTemporalEvolucion,
  ResultadoSeriesEvolucion,
} from './types';

function calcularDelta(actual: number | null, base: number | null) {
  if (actual == null || base == null) {
    return null;
  }

  return Number((actual - base).toFixed(2));
}

function calcularDeltaPorcentual(actual: number | null, base: number | null) {
  if (actual == null || base == null || base === 0) {
    return null;
  }

  return Number((((actual - base) / base) * 100).toFixed(2));
}

function obtenerFechaCorte(rango: RangoTemporalEvolucion, fechaMaxima: Date) {
  switch (rango) {
    case '30d':
      return subDays(fechaMaxima, 30);
    case '90d':
      return subDays(fechaMaxima, 90);
    case '6m':
      return subMonths(fechaMaxima, 6);
    case '12m':
      return subYears(fechaMaxima, 1);
    case 'todo':
    default:
      return null;
  }
}

function construirKpi(
  actual: number | null,
  base: number | null,
  unidad: string,
): KpiEvolucion {
  return {
    valor: actual,
    deltaLineaBase: calcularDelta(actual, base),
    deltaPorcentual: calcularDeltaPorcentual(actual, base),
    unidad,
    tendenciaTexto: actual != null && base != null ? 'vs linea base' : null,
  };
}

function construirSeriePliegues(
  mediciones: MedicionHistorial[],
): PuntoSeriePliegues[] {
  return mediciones.map((medicion) => {
    const valores = [
      medicion.pliegueTriceps,
      medicion.pliegueAbdominal,
      medicion.pliegueMuslo,
    ].filter((valor): valor is number => valor != null);

    return {
      fecha: medicion.fecha,
      fechaFormateada: format(parseISO(medicion.fecha), 'dd MMM', { locale: es }),
      triceps: medicion.pliegueTriceps,
      abdominal: medicion.pliegueAbdominal,
      muslo: medicion.pliegueMuslo,
      sumaPliegues: valores.length > 0 ? valores.reduce((a, b) => a + b, 0) : null,
    };
  });
}

export function derivarSeriesEvolucion(
  historial: HistorialMediciones | undefined,
  rango: RangoTemporalEvolucion,
): ResultadoSeriesEvolucion {
  const medicionesOrdenadas = [...(historial?.mediciones ?? [])].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );

  const fechaMaxima = medicionesOrdenadas.at(-1)
    ? new Date(medicionesOrdenadas.at(-1)!.fecha)
    : null;
  const fechaCorte = fechaMaxima ? obtenerFechaCorte(rango, fechaMaxima) : null;
  const medicionesFiltradas = fechaCorte
    ? medicionesOrdenadas.filter(
        (medicion) => new Date(medicion.fecha).getTime() >= fechaCorte.getTime(),
      )
    : medicionesOrdenadas;

  const primeraMedicion = medicionesOrdenadas[0] ?? null;
  const ultimaMedicion = medicionesFiltradas.at(-1) ?? null;

  return {
    mediciones: medicionesFiltradas,
    kpis: {
      pesoActual: construirKpi(
        ultimaMedicion?.peso ?? null,
        primeraMedicion?.peso ?? null,
        'kg',
      ),
      cinturaActual: construirKpi(
        ultimaMedicion?.perimetroCintura ?? null,
        primeraMedicion?.perimetroCintura ?? null,
        'cm',
      ),
      grasaCorporalActual: construirKpi(
        ultimaMedicion?.porcentajeGrasa ?? null,
        primeraMedicion?.porcentajeGrasa ?? null,
        '%',
      ),
      masaMagraActual: construirKpi(
        ultimaMedicion?.masaMagra ?? null,
        primeraMedicion?.masaMagra ?? null,
        'kg',
      ),
    },
    series: {
      peso: medicionesFiltradas,
      pliegues: construirSeriePliegues(medicionesFiltradas),
    },
  };
}
