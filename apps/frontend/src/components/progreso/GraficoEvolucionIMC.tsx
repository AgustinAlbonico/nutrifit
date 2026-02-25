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
  ReferenceArea,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HistorialMediciones, DatoGraficoPeso } from './types';

interface GraficoEvolucionIMCProps {
  historial: HistorialMediciones | undefined;
}

const CATEGORIAS_IMC = [
  { min: 0, max: 18.5, color: '#fbbf24', nombre: 'Bajo peso' },
  { min: 18.5, max: 25, color: '#22c55e', nombre: 'Normal' },
  { min: 25, max: 30, color: '#f97316', nombre: 'Sobrepeso' },
  { min: 30, max: 40, color: '#ef4444', nombre: 'Obesidad' },
];

export function GraficoEvolucionIMC({ historial }: GraficoEvolucionIMCProps) {
  const datos: DatoGraficoPeso[] = useMemo(() => {
    if (!historial?.mediciones || historial.mediciones.length === 0) {
      return [];
    }

    const medicionesOrdenadas = [...historial.mediciones].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    return medicionesOrdenadas.map((m) => ({
      fecha: m.fecha,
      fechaFormateada: format(parseISO(m.fecha), 'dd MMM', { locale: es }),
      peso: m.peso,
      imc: m.imc,
    }));
  }, [historial]);

  if (datos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-gray-50">
        <p className="text-gray-500">No hay datos de IMC para mostrar</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Evolución de IMC
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
            domain={[15, 35]}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{
              value: 'IMC',
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
          
          {/* Zonas de categorías IMC */}
          <ReferenceArea y1={0} y2={18.5} fill="#fef3c7" fillOpacity={0.3} />
          <ReferenceArea y1={18.5} y2={25} fill="#dcfce7" fillOpacity={0.3} />
          <ReferenceArea y1={25} y2={30} fill="#ffedd5" fillOpacity={0.3} />
          <ReferenceArea y1={30} y2={40} fill="#fee2e2" fillOpacity={0.3} />
          
          <Line
            type="monotone"
            dataKey="imc"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
            name="IMC"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Leyenda de categorías */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        {CATEGORIAS_IMC.map((cat) => (
          <div key={cat.nombre} className="flex items-center gap-1">
            <div
              className="h-3 w-3 rounded"
              style={{ backgroundColor: cat.color, opacity: 0.5 }}
            />
            <span className="text-gray-600">
              {cat.nombre} (&lt;{cat.max})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
