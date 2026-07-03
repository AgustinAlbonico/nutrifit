import { Suspense, lazy, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { GraficoEvolucionPeso } from '@/components/progreso/GraficoEvolucionPeso';
import { PanelPlieguesEvolucion } from '@/components/progreso/PanelPlieguesEvolucion';
import type { HistorialMediciones, ResumenProgreso } from '@/components/progreso/types';

export type ModoGraficoPrincipal =
  | 'peso'
  | 'imc'
  | 'perimetros'
  | 'pliegues'
  | 'composicion'
  | 'signos';

interface PropiedadesGraficoPrincipalEvolucion {
  modo: ModoGraficoPrincipal;
  onCambiarModo: (modo: ModoGraficoPrincipal) => void;
  historial: HistorialMediciones | undefined;
  resumen: ResumenProgreso | undefined;
  objetivoPeso?: number | null;
}

const MODOS: Array<{ id: ModoGraficoPrincipal; label: string }> = [
  { id: 'peso', label: 'Peso' },
  { id: 'imc', label: 'IMC' },
  { id: 'perimetros', label: 'Perimetros' },
  { id: 'pliegues', label: 'Pliegues' },
  { id: 'composicion', label: 'Composicion' },
  { id: 'signos', label: 'Signos vitales' },
];

const TITULOS: Record<ModoGraficoPrincipal, string> = {
  peso: 'Peso e IMC',
  imc: 'Indice de masa corporal',
  perimetros: 'Perimetros corporales',
  pliegues: 'Pliegues cutaneos',
  composicion: 'Composicion corporal',
  signos: 'Signos vitales',
};

function formatearFecha(fecha: string) {
  return format(parseISO(fecha), 'dd MMM', { locale: es });
}

interface SerieGrafico {
  key: string;
  nombre: string;
  color: string;
}

const ContenedorGraficoLinea = lazy(async () => {
  const Recharts = await import('recharts');
  return {
    default: function ContenedorGraficoLinea(props: {
      datos: Array<Record<string, number | string | null>>;
      series: SerieGrafico[];
      unidad?: string;
    }) {
      const { datos, series, unidad } = props;
      return (
        <div className="h-80">
          <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.LineChart data={datos} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <Recharts.XAxis dataKey="fecha" stroke="#64748b" tick={{ fontSize: 12 }} />
              <Recharts.YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                label={
                  unidad
                    ? { value: unidad, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }
                    : undefined
                }
              />
              <Recharts.Tooltip />
              <Recharts.Legend />
              {series.map((s) => (
                <Recharts.Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.nombre}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </Recharts.LineChart>
          </Recharts.ResponsiveContainer>
        </div>
      );
    },
  };
});

function useDatosOrdenados(historial: HistorialMediciones | undefined) {
  return useMemo(() => {
    if (!historial) return [];
    return historial.mediciones
      .slice()
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((medicion) => ({
        fecha: formatearFecha(medicion.fecha),
        imc: medicion.imc,
        cintura: medicion.perimetroCintura,
        cadera: medicion.perimetroCadera,
        brazo: medicion.perimetroBrazo,
        muslo: medicion.perimetroMuslo,
        pecho: medicion.perimetroPecho,
        grasa: medicion.porcentajeGrasa,
        masaMagra: medicion.masaMagra,
        sistolica: medicion.tensionSistolica,
        diastolica: medicion.tensionDiastolica,
        fc: medicion.frecuenciaCardiaca,
      }));
  }, [historial]);
}

function GraficoLineaSimple(props: {
  datos: Array<Record<string, number | string | null>>;
  series: SerieGrafico[];
  unidad?: string;
}) {
  if (props.datos.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed bg-slate-50 text-sm text-slate-500">
        Sin datos para graficar.
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="flex h-72 items-center justify-center rounded-2xl border bg-slate-50 text-sm text-slate-500">
          Cargando gráfico…
        </div>
      }
    >
      <ContenedorGraficoLinea datos={props.datos} series={props.series} unidad={props.unidad} />
    </Suspense>
  );
}

export function GraficoPrincipalEvolucion({
  modo,
  onCambiarModo,
  historial,
  resumen,
  objetivoPeso,
}: PropiedadesGraficoPrincipalEvolucion) {
  const datos = useDatosOrdenados(historial);

  return (
    <section className="space-y-4 rounded-[1.75rem] border bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Serie temporal principal</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{TITULOS[modo]}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Cambia de enfoque segun la metrica que necesites analizar sin salir del mismo recorrido longitudinal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODOS.map((opcion) => (
            <Button
              key={opcion.id}
              type="button"
              variant={modo === opcion.id ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => onCambiarModo(opcion.id)}
            >
              {opcion.label}
            </Button>
          ))}
        </div>
      </div>

      {modo === 'peso' && (
        <GraficoEvolucionPeso historial={historial} resumen={resumen} objetivoPeso={objetivoPeso} />
      )}
      {modo === 'pliegues' && <PanelPlieguesEvolucion historial={historial} />}
      {modo === 'imc' && (
        <GraficoLineaSimple
          datos={datos}
          series={[{ key: 'imc', nombre: 'IMC', color: '#f59e0b' }]}
          unidad="IMC"
        />
      )}
      {modo === 'perimetros' && (
        <GraficoLineaSimple
          datos={datos}
          series={[
            { key: 'cintura', nombre: 'Cintura', color: '#f97316' },
            { key: 'cadera', nombre: 'Cadera', color: '#0f766e' },
            { key: 'brazo', nombre: 'Brazo', color: '#7c3aed' },
            { key: 'muslo', nombre: 'Muslo', color: '#2563eb' },
            { key: 'pecho', nombre: 'Pecho', color: '#db2777' },
          ]}
          unidad="cm"
        />
      )}
      {modo === 'composicion' && (
        <GraficoLineaSimple
          datos={datos}
          series={[
            { key: 'grasa', nombre: '% Grasa', color: '#f97316' },
            { key: 'masaMagra', nombre: 'Masa magra (kg)', color: '#0f766e' },
          ]}
        />
      )}
      {modo === 'signos' && (
        <GraficoLineaSimple
          datos={datos}
          series={[
            { key: 'sistolica', nombre: 'Sistolica', color: '#dc2626' },
            { key: 'diastolica', nombre: 'Diastolica', color: '#7c3aed' },
            { key: 'fc', nombre: 'Frec. cardiaca', color: '#0f766e' },
          ]}
        />
      )}
    </section>
  );
}
