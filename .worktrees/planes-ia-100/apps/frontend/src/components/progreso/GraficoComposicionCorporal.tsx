import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HistorialMediciones, DatoGraficoComposicion } from './types';

interface GraficoComposicionCorporalProps {
  historial: HistorialMediciones | undefined;
}

export function GraficoComposicionCorporal({ historial }: GraficoComposicionCorporalProps) {
  const datos: DatoGraficoComposicion[] = useMemo(() => {
    if (!historial?.mediciones || historial.mediciones.length === 0) {
      return [];
    }

    const medicionesOrdenadas = [...historial.mediciones].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    return medicionesOrdenadas.map((m) => ({
      fecha: m.fecha,
      fechaFormateada: format(parseISO(m.fecha), 'dd MMM', { locale: es }),
      porcentajeGrasa: m.porcentajeGrasa,
      masaMagra: m.masaMagra,
    }));
  }, [historial]);

  const hayDatos = datos.some((d) => d.porcentajeGrasa || d.masaMagra);

  if (!hayDatos) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">No hay datos de composición corporal para mostrar</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Composición Corporal
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={datos} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="fechaFormateada"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            yAxisId="porcentaje"
            orientation="left"
            domain={[0, 50]}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{
              value: '% Grasa',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#6b7280' },
            }}
          />
          <YAxis
            yAxisId="masa"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{
              value: 'Masa magra (kg)',
              angle: 90,
              position: 'insideRight',
              style: { fontSize: 12, fill: '#6b7280' },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Legend />
          <Bar
            yAxisId="porcentaje"
            dataKey="porcentajeGrasa"
            fill="#f472b6"
            radius={[4, 4, 0, 0]}
            name="% Grasa"
          />
          <Line
            yAxisId="masa"
            type="monotone"
            dataKey="masaMagra"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
            name="Masa magra"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
