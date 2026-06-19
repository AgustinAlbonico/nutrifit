import type { KpiEvolucion } from './types';

interface PropiedadesPanelComposicionCorporal {
  grasaCorporal: KpiEvolucion | undefined;
  masaMagra: KpiEvolucion | undefined;
}

function formatearKpi(kpi: KpiEvolucion | undefined) {
  if (!kpi || kpi.valor == null) {
    return '-';
  }

  return `${kpi.valor} ${kpi.unidad}`;
}

function formatearDelta(kpi: KpiEvolucion | undefined) {
  if (!kpi || kpi.deltaLineaBase == null) {
    return 'Sin datos suficientes';
  }

  const signo = kpi.deltaLineaBase > 0 ? '+' : '';
  return `${signo}${kpi.deltaLineaBase} ${kpi.unidad} vs linea base`;
}

function grasaDisponible(kpi: KpiEvolucion | undefined) {
  return Boolean(kpi && kpi.valor != null);
}

export function PanelComposicionCorporal({
  grasaCorporal,
  masaMagra,
}: PropiedadesPanelComposicionCorporal) {
  const hayGrasa = grasaDisponible(grasaCorporal);

  return (
    <section className="rounded-[1.75rem] border bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Composicion corporal</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Lectura corporal actual</h2>
        <p className="max-w-2xl text-sm text-slate-600">
          Combina porcentaje graso y masa magra para leer mejor la calidad del cambio, no solo el peso.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-950">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Grasa corporal</p>
          <p className="mt-3 text-3xl font-black tracking-tight">{formatearKpi(grasaCorporal)}</p>
          <p className="mt-2 text-sm text-emerald-800/80">{formatearDelta(grasaCorporal)}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 p-4 text-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Masa magra</p>
          {hayGrasa ? (
            <>
              <p className="mt-3 text-3xl font-black tracking-tight">{formatearKpi(masaMagra)}</p>
              <p className="mt-2 text-sm text-slate-600">{formatearDelta(masaMagra)}</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-3xl font-black tracking-tight">No aplica</p>
              <p className="mt-2 text-sm text-slate-600">
                Requiere porcentaje de grasa corporal para calcularse.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
