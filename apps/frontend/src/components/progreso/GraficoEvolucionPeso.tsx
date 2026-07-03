import { Suspense, lazy, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HistorialMediciones, ResumenProgreso, DatoGraficoPeso } from './types';

const ContenedorGraficoPeso = lazy(async () => {
  const Recharts = await import('recharts');
  return {
    default: function ContenedorGraficoPeso(props: {
      datos: DatoGraficoPeso[];
      resumen: ResumenProgreso | undefined;
      objetivoPeso: number | null;
      pesoMinimo: number;
      pesoMaximo: number;
    }) {
      const { datos, resumen, objetivoPeso, pesoMinimo, pesoMaximo } = props;
      return (
        <Recharts.ResponsiveContainer width="100%" height={300}>
          <Recharts.LineChart data={datos} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <Recharts.XAxis dataKey="fechaFormateada" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Recharts.YAxis
              yAxisId="peso"
              domain={[pesoMinimo, pesoMaximo]}
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              label={{
                value: 'Peso (kg)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#6b7280' },
              }}
            />
            <Recharts.YAxis
              yAxisId="imc"
              orientation="right"
              domain={[0, 40]}
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              label={{
                value: 'IMC',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: 12, fill: '#6b7280' },
              }}
            />
            <Recharts.Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              labelFormatter={(etiqueta) => `Fecha: ${etiqueta}`}
            />
            <Recharts.Legend />
            {resumen?.rangoSaludable.pesoMinimo && resumen?.rangoSaludable.pesoMaximo && (
              <Recharts.Area
                yAxisId="peso"
                type="monotone"
                dataKey={() => resumen.rangoSaludable.pesoMaximo}
                stroke="none"
                fill="#22c55e"
                fillOpacity={0.1}
                name="Rango saludable"
              />
            )}
            <Recharts.Line
              yAxisId="peso"
              type="monotone"
              dataKey="peso"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="peso"
            />
            {objetivoPeso != null && (
              <Recharts.Line
                yAxisId="peso"
                type="monotone"
                dataKey="objetivo"
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name="objetivo"
              />
            )}
            <Recharts.Line
              yAxisId="imc"
              type="monotone"
              dataKey="imc"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              name="imc"
            />
          </Recharts.LineChart>
        </Recharts.ResponsiveContainer>
      );
    },
  };
});

interface GraficoEvolucionPesoProps {
  historial: HistorialMediciones | undefined;
  resumen: ResumenProgreso | undefined;
  objetivoPeso?: number | null;
}

export function GraficoEvolucionPeso({ historial, resumen, objetivoPeso }: GraficoEvolucionPesoProps) {
  const datos: DatoGraficoPeso[] = useMemo(() => {
    if (!historial?.mediciones || historial.mediciones.length === 0) {
      return [];
    }

    // Ordenar por fecha ascendente para el gráfico (clonamos para no mutar el array original).
    const medicionesOrdenadas = historial.mediciones
      .slice()
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return medicionesOrdenadas.map((m) => ({
      fecha: m.fecha,
      fechaFormateada: format(parseISO(m.fecha), 'dd MMM', { locale: es }),
      peso: m.peso,
      imc: m.imc,
      objetivo: objetivoPeso ?? undefined,
      pesoMinimoSaludable: resumen?.rangoSaludable.pesoMinimo ?? undefined,
      pesoMaximoSaludable: resumen?.rangoSaludable.pesoMaximo ?? undefined,
    }));
  }, [historial, objetivoPeso, resumen]);

  if (datos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">No hay datos de peso para mostrar</p>
      </div>
    );
  }

  const valoresPeso = datos.flatMap((d) => (d.objetivo == null ? [d.peso] : [d.peso, d.objetivo]));
  const pesoMinimo = Math.min(...valoresPeso) - 2;
  const pesoMaximo = Math.max(...valoresPeso) + 2;

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Evolución de Peso</h3>
      {objetivoPeso != null && (
        <p className="mb-3 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Objetivo de peso: {objetivoPeso} kg
        </p>
      )}
      <Suspense
        fallback={
          <div className="flex h-[300px] items-center justify-center rounded-lg border bg-gray-50">
            <p className="text-sm text-gray-500">Cargando gráfico…</p>
          </div>
        }
      >
        <ContenedorGraficoPeso
          datos={datos}
          resumen={resumen}
          objetivoPeso={objetivoPeso ?? null}
          pesoMinimo={pesoMinimo}
          pesoMaximo={pesoMaximo}
        />
      </Suspense>
    </div>
  );
}
