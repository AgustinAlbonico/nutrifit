import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { HistorialMediciones } from './types';

interface PropiedadesPanelPlieguesEvolucion {
  historial: HistorialMediciones | undefined;
}

function formatearNumero(valor: number | null) {
  if (valor == null) {
    return '-';
  }

  return `${valor} mm`;
}

export function PanelPlieguesEvolucion({ historial }: PropiedadesPanelPlieguesEvolucion) {
  const datos = useMemo(() => {
    return [...(historial?.mediciones ?? [])]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((medicion) => {
        const suma = [
          medicion.pliegueTriceps,
          medicion.pliegueAbdominal,
          medicion.pliegueMuslo,
        ]
          .filter((valor): valor is number => valor != null)
          .reduce((acumulado, valor) => acumulado + valor, 0);

        return {
          fecha: new Date(medicion.fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
          }),
          triceps: medicion.pliegueTriceps,
          abdominal: medicion.pliegueAbdominal,
          muslo: medicion.pliegueMuslo,
          suma: suma > 0 ? suma : null,
        };
      });
  }, [historial]);

  const sumaInicial = datos[0]?.suma ?? null;
  const sumaActual = datos.at(-1)?.suma ?? null;
  const conteoPlieguesActual = datos.at(-1)
    ? [datos.at(-1)!.triceps, datos.at(-1)!.abdominal, datos.at(-1)!.muslo].filter(
        (valor): valor is number => valor != null,
      ).length
    : 0;
  const todosLosPlieguesCargados = conteoPlieguesActual === 3;
  const sumaEsParcial = Boolean(sumaActual != null) && !todosLosPlieguesCargados;
  const delta =
    sumaActual != null && sumaInicial != null ? Number((sumaActual - sumaInicial).toFixed(1)) : null;

  if (datos.length === 0) {
    return (
      <section className="rounded-[1.75rem] border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Pliegues</p>
        <div className="mt-4 flex h-72 items-center justify-center rounded-[1.5rem] border border-dashed bg-slate-50 text-sm text-slate-500">
          No hay datos de pliegues para mostrar.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Adiposidad subcutanea</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Pliegues cutaneos</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Segui la evolucion de triceps, abdominal, muslo y la suma total de pliegues por sesion.
          </p>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datos} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fecha" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="triceps" name="Triceps" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="abdominal" name="Abdominal" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="muslo" name="Muslo" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="suma" name="Suma pliegues" stroke="#111827" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4 self-start">
          <div className="rounded-[1.5rem] bg-orange-50 p-4 text-orange-950">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">Suma actual</p>
            <p className="mt-3 text-3xl font-black tracking-tight">{formatearNumero(sumaActual)}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-orange-800/80">
              {sumaEsParcial
                ? `${conteoPlieguesActual} de 3 pliegues`
                : '3 de 3 pliegues'}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-4 text-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Cambio vs inicio</p>
            <p className="mt-3 text-3xl font-black tracking-tight">
              {delta == null ? '-' : `${delta > 0 ? '+' : ''}${delta} mm`}
            </p>
            {sumaEsParcial && (
              <p className="mt-2 text-xs text-slate-500">
                Comparar solo con sesiones que midan los mismos pliegues.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
