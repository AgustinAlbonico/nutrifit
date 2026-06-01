import { Activity, Users, Calendar, FileText, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { EstadisticasKpiCard } from '@/components/dashboard/EstadisticasKpiCard';
import { AccionesRapidasCard } from '@/components/dashboard/AccionesRapidasCard';
import { PacienteDestacadoCard } from '@/components/dashboard/PacienteDestacadoCard';
import { TurnosDelDiaCard } from '@/components/dashboard/TurnosDelDiaCard';
import { PacientesRecientesCard } from '@/components/dashboard/PacientesRecientesCard';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface Paciente {
  idSocio: number;
  nombreCompleto: string;
}

interface TurnoDelDia {
  idTurno: number;
  estadoTurno: string;
}

interface Plan {
  idPlan: number;
}

export function DashboardNutricionista() {
  const { token, personaId } = useAuth();

  // Query: Pacientes del nutricionista
  const { data: pacientes, isLoading: cargandoPacientes } = useQuery({
    queryKey: ['pacientes-count', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Paciente[]>>(
        `/turnos/profesional/${personaId}/pacientes`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  // Query: Turnos de hoy
  const { data: turnosHoy, isLoading: cargandoTurnos } = useQuery({
    queryKey: ['turnos-hoy-count', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<TurnoDelDia[]>>(
        `/turnos/profesional/${personaId}/hoy`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  // Query: Planes creados
  const { data: planes, isLoading: cargandoPlanes } = useQuery({
    queryKey: ['planes-count', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Plan[]>>(
        `/planes-alimentacion/nutricionista/${personaId}`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  // Calculos de KPIs
  const pacientesActivos = pacientes?.length ?? 0;
  const turnosHoyCount = turnosHoy?.length ?? 0;
  const pendientesCount =
    turnosHoy?.filter((t) => t.estadoTurno === 'PROGRAMADO').length ?? 0;
  const planesCount = planes?.length ?? 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="h-8 w-8 text-orange-500" />
            Dashboard Nutricionista
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Panel de control con tus metricas y accesos rapidos.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <EstadisticasKpiCard
          titulo="Pacientes Activos"
          valor={pacientesActivos}
          icono={<Users className="h-4 w-4" />}
          cargando={cargandoPacientes}
        />
        <EstadisticasKpiCard
          titulo="Turnos Hoy"
          valor={turnosHoyCount}
          icono={<Calendar className="h-4 w-4" />}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Planes Creados"
          valor={planesCount}
          icono={<FileText className="h-4 w-4" />}
          cargando={cargandoPlanes}
        />
        <EstadisticasKpiCard
          titulo="Pendientes"
          valor={pendientesCount}
          icono={<Clock className="h-4 w-4" />}
          badge={
            pendientesCount > 0
              ? { texto: 'Atencion', variante: 'secondary' }
              : undefined
          }
          cargando={cargandoTurnos}
        />
      </div>

      {/* Grid Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        <TurnosDelDiaCard />
        <PacientesRecientesCard />
        <AccionesRapidasCard />
        <PacienteDestacadoCard />
      </div>
    </div>
  );
}
