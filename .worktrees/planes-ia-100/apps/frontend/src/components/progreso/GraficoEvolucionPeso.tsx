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
  Area,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HistorialMediciones, ResumenProgreso, DatoGraficoPeso } from './types';

interface GraficoEvolucionPesoProps {
  historial: HistorialMediciones | undefined;
  resumen: ResumenProgreso | undefined;
}

export function GraficoEvolucionPeso({ historial, resumen }: GraficoEvolucionPesoProps) {
  const datos: DatoGraficoPeso[] = useMemo(() => {
    if (!historial?.mediciones || historial.mediciones.length === 0) {
      return [];
    }

    // Ordenar por fecha ascendente para el gráfico
    const medicionesOrdenadas = [...historial.mediciones].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    return medicionesOrdenadas.map((m) => ({
      fecha: m.fecha,
      fechaFormateada: format(parseISO(m.fecha), 'dd MMM', { locale: es }),
      peso: m.peso,
      imc: m.imc,
      pesoMinimoSaludable: resumen?.rangoSaludable.pesoMinimo ?? undefined,
      pesoMaximoSaludable: resumen?.rangoSaludable.pesoMaximo ?? undefined,
    }));
  }, [historial, resumen]);

  if (datos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">No hay datos de peso para mostrar</p>
      </div>
    );
  }

  const pesoMinimo = Math.min(...datos.map((d) => d.peso)) - 2;
  const pesoMaximo = Math.max(...datos.map((d) => d.peso)) + 2;

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Evolución de Peso
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
          <YAxis
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
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Legend />
          {/* Área de rango saludable */}
          {resumen?.rangoSaludable.pesoMinimo && resumen?.rangoSaludable.pesoMaximo && (
            <Area
              yAxisId="peso"
              type="monotone"
              dataKey={() => resumen.rangoSaludable.pesoMaximo}
              stroke="none"
              fill="#22c55e"
              fillOpacity={0.1}
              name="Rango saludable"
            />
          )}
          <Line
            yAxisId="peso"
            type="monotone"
            dataKey="peso"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="peso"
          />
          <Line
            yAxisId="imc"
            type="monotone"
            dataKey="imc"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
            name="imc"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
