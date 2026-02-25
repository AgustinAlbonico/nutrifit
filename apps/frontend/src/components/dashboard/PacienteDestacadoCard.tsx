import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Paciente {
  idSocio: number;
  nombreCompleto: string;
}

interface Medicion {
  idMedicion: number;
  peso: number;
  fecha: string;
  imc?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function PacienteDestacadoCard() {
  const { token, personaId } = useAuth();
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>('');

  // Obtener lista de pacientes
  const { data: pacientes = [], isLoading: cargandoPacientes } = useQuery({
    queryKey: ['pacientes-nutricionista', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Paciente[]>>(
        `/turnos/profesional/${personaId}/pacientes`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  // Obtener progreso del paciente seleccionado
  const { data: progreso, isLoading: cargandoProgreso } = useQuery({
    queryKey: ['progreso-paciente', pacienteSeleccionado, personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Medicion[]>>(
        `/turnos/profesional/${personaId}/pacientes/${pacienteSeleccionado}/historial-mediciones`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!pacienteSeleccionado && !!token && !!personaId,
  });

  // Formatear datos para el gráfico
  const datosGrafico =
    progreso?.map((m) => ({
      fecha: new Date(m.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
      }),
      peso: m.peso,
    })) ?? [];

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Paciente Destacado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={pacienteSeleccionado}
          onValueChange={setPacienteSeleccionado}
          disabled={cargandoPacientes}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar paciente..." />
          </SelectTrigger>
          <SelectContent>
            {pacientes.filter((p) => p.idSocio !== undefined).map((p) => (
              <SelectItem key={p.idSocio} value={String(p.idSocio)}>
                {p.nombreCompleto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pacienteSeleccionado && (
          <div className="mt-4">
            {cargandoProgreso ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Cargando progreso...
              </p>
            ) : datosGrafico.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosGrafico.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 10 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tick={{ fontSize: 10 }}
                      stroke="#9ca3af"
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(valor: number | undefined) => valor !== undefined ? [`${valor} kg`, 'Peso'] : ['', 'Peso']}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#f97316' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin mediciones registradas
              </p>
            )}
          </div>
        )}

        {!pacienteSeleccionado && (
          <p className="text-sm text-muted-foreground mt-4 text-center py-6">
            Selecciona un paciente para ver su progreso de peso
          </p>
        )}
      </CardContent>
    </Card>
  );
}
