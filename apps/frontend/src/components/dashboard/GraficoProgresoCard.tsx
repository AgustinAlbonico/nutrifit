import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Medicion {
  fecha: string;
  peso: number;
  imc?: number;
}

interface Progreso {
  pesoActual: number;
  pesoObjetivo: number | null;
  imc: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function GraficoProgresoCard() {
  const { token } = useAuth();

  const { data: historialResponse, isLoading: cargandoHistorial } = useQuery({
    queryKey: ['historial-mediciones', token],
    queryFn: async () => {
      const resp = await apiRequest<ApiResponse<Medicion[]>>(
        '/turnos/socio/mi-historial-mediciones',
        { token }
      );
      return resp;
    },
    enabled: !!token,
  });

  const { data: progreso } = useQuery({
    queryKey: ['mi-progreso', token],
    queryFn: async () => {
      const resp = await apiRequest<Progreso>(
        '/turnos/socio/mi-progreso',
        { token }
      );
      return resp;
    },
    enabled: !!token,
  });

  // Asegurar que historial sea siempre un array
  const historial = Array.isArray(historialResponse?.data)
    ? historialResponse.data
    : Array.isArray(historialResponse)
      ? historialResponse
      : [];

  if (cargandoHistorial) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Mi Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!historial || historial.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Mi Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Aun no tienes mediciones registradas para graficar.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Formatear datos para el grafico
  const datosGrafico = historial.map((m) => ({
    fecha: new Date(m.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    peso: m.peso,
    imc: m.imc,
  }));

  const pesoObjetivo = progreso?.pesoObjetivo;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Mi Progreso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />

              {/* Linea de peso objetivo */}
              {pesoObjetivo && (
                <ReferenceLine
                  y={pesoObjetivo}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  label={{ value: 'Objetivo', fontSize: 10, fill: '#22c55e' }}
                />
              )}

              <Line
                type="monotone"
                dataKey="peso"
                name="Peso (kg)"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f97316' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
