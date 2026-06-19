import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import type {
  KpiEvolucion,
  RangoTemporalEvolucion,
  RiesgoCardiovascular,
} from './types';

interface PropiedadesPanelResumenEvolucion {
  titulo: string;
  subtitulo: string;
  rangoTemporal: RangoTemporalEvolucion;
  onCambiarRango: (rango: RangoTemporalEvolucion) => void;
  kpis: {
    pesoActual?: KpiEvolucion;
    cinturaActual?: KpiEvolucion;
  };
  riesgoCardiovascular?: {
    relacion: number | null;
    categoria: RiesgoCardiovascular | null;
  };
  acciones?: ReactNode;
}

const ETIQUETAS_RIESGO: Record<RiesgoCardiovascular, string> = {
  bajo: 'Bajo',
  moderado: 'Moderado',
  alto: 'Alto',
};

const COLORES_RIESGO: Record<RiesgoCardiovascular, string> = {
  bajo: 'bg-emerald-100 text-emerald-700',
  moderado: 'bg-amber-100 text-amber-700',
  alto: 'bg-rose-100 text-rose-700',
};

const RANGOS: Array<{ id: RangoTemporalEvolucion; label: string }> = [
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
  { id: '6m', label: '6 meses' },
  { id: '12m', label: '12 meses' },
  { id: 'todo', label: 'Todo' },
];

function formatearValor(kpi: KpiEvolucion | undefined) {
  if (!kpi || kpi.valor == null) {
    return '-';
  }

  return `${kpi.valor} ${kpi.unidad}`;
}

function formatearDelta(kpi: KpiEvolucion | undefined) {
  if (!kpi || kpi.deltaLineaBase == null) {
    return 'Sin linea base';
  }

  const signo = kpi.deltaLineaBase > 0 ? '+' : '';
  return `${signo}${kpi.deltaLineaBase} ${kpi.unidad} ${kpi.tendenciaTexto ?? ''}`.trim();
}

function TarjetaKpi({ titulo, kpi }: { titulo: string; kpi: KpiEvolucion | undefined }) {
  return (
    <div className="rounded-[1.75rem] border border-orange-950/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">{titulo}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{formatearValor(kpi)}</p>
      <p className="mt-2 text-sm text-slate-600">{formatearDelta(kpi)}</p>
    </div>
  );
}

export function PanelResumenEvolucion({
  titulo,
  subtitulo,
  rangoTemporal,
  onCambiarRango,
  kpis,
  riesgoCardiovascular,
  acciones,
}: PropiedadesPanelResumenEvolucion) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-[linear-gradient(135deg,rgba(255,247,237,0.98),rgba(255,255,255,0.95)),radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_38%)] p-6 shadow-sm sm:p-8">
      <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-400/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
              Ficha longitudinal
            </p>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {titulo}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">{subtitulo}</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 xl:items-end">
            <div className="flex flex-wrap gap-2">
              {RANGOS.map((rango) => (
                <Button
                  key={rango.id}
                  type="button"
                  variant={rangoTemporal === rango.id ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => onCambiarRango(rango.id)}
                >
                  {rango.label}
                </Button>
              ))}
            </div>
            {acciones ? <div className="flex flex-wrap gap-3">{acciones}</div> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:max-w-4xl">
          <TarjetaKpi titulo="Peso actual" kpi={kpis.pesoActual} />
          <TarjetaKpi titulo="Cintura actual" kpi={kpis.cinturaActual} />
          {riesgoCardiovascular ? (
            <div className="rounded-[1.75rem] border border-orange-950/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Riesgo cardiovascular</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {riesgoCardiovascular.relacion != null
                  ? riesgoCardiovascular.relacion.toFixed(2)
                  : '-'}
              </p>
              {riesgoCardiovascular.categoria ? (
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLORES_RIESGO[riesgoCardiovascular.categoria]}`}
                >
                  {ETIQUETAS_RIESGO[riesgoCardiovascular.categoria]}
                </span>
              ) : (
                <>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">No aplica</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Requiere sexo biologico clasificado para calcularse.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
