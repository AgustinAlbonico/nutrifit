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
import type { HistorialMediciones, DatoGraficoPerimetros } from './types';

interface GraficoPerimetrosProps {
  historial: HistorialMediciones | undefined;
}

export function GraficoPerimetros({ historial }: GraficoPerimetrosProps) {
  const datos: DatoGraficoPerimetros[] = useMemo(() => {
    if (!historial?.mediciones || historial.mediciones.length === 0) {
      return [];
    }

    const medicionesOrdenadas = [...historial.mediciones].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    return medicionesOrdenadas.map((m) => ({
      fecha: m.fecha,
      fechaFormateada: format(parseISO(m.fecha), 'dd MMM', { locale: es }),
      cintura: m.perimetroCintura,
      cadera: m.perimetroCadera,
      brazo: m.perimetroBrazo,
      muslo: m.perimetroMuslo,
    }));
  }, [historial]);

  // Verificar si hay al menos algún dato de perímetros
  const hayDatos = datos.some(
    (d) => d.cintura || d.cadera || d.brazo || d.muslo
  );

  if (!hayDatos) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">No hay datos de perímetros para mostrar</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Evolución de Perímetros
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
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{
              value: 'cm',
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
            dataKey="cintura"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            name="Cintura"
          />
          <Line
            type="monotone"
            dataKey="cadera"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            name="Cadera"
          />
          <Line
            type="monotone"
            dataKey="brazo"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            name="Brazo"
          />
          <Line
            type="monotone"
            dataKey="muslo"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            name="Muslo"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
