import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HistorialMediciones, DatoGraficoSignosVitales } from './types';

interface GraficoSignosVitalesProps {
  historial: HistorialMediciones | undefined;
}

export function GraficoSignosVitales({ historial }: GraficoSignosVitalesProps) {
  const datos: DatoGraficoSignosVitales[] = useMemo(() => {
    if (!historial?.mediciones || historial.mediciones.length === 0) {
      return [];
    }

    const medicionesOrdenadas = [...historial.mediciones].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    return medicionesOrdenadas.map((m) => ({
      fecha: m.fecha,
      fechaFormateada: format(parseISO(m.fecha), 'dd MMM', { locale: es }),
      frecuenciaCardiaca: m.frecuenciaCardiaca,
      tensionSistolica: m.tensionSistolica,
      tensionDiastolica: m.tensionDiastolica,
    }));
  }, [historial]);

  const hayDatos = datos.some(
    (d) => d.frecuenciaCardiaca || d.tensionSistolica || d.tensionDiastolica
  );

  if (!hayDatos) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">No hay datos de signos vitales para mostrar</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Signos Vitales
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={datos} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="fechaFormateada"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            domain={[40, 180]}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{
              value: 'mmHg / lpm',
              angle: -90,
              position: 'insideLeft',
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
          <Line
            type="monotone"
            dataKey="frecuenciaCardiaca"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            name="FC (lpm)"
          />
          <Line
            type="monotone"
            dataKey="tensionSistolica"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            name="Tensión sistólica"
          />
          <Line
            type="monotone"
            dataKey="tensionDiastolica"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            name="Tensión diastólica"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
