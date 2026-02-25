import { LayoutDashboard, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { EstadisticasKpiCard } from '@/components/dashboard/EstadisticasKpiCard';
import { TurnosTablaCard } from '@/components/dashboard/TurnosTablaCard';
import { AgendaProfesionalesCard } from '@/components/dashboard/AgendaProfesionalesCard';
import { AccionesRapidasRecepcionCard } from '@/components/dashboard/AccionesRapidasRecepcionCard';
import { UltimosRegistradosCard } from '@/components/dashboard/UltimosRegistradosCard';

interface TurnoRecepcion {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: 'PENDIENTE' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO';
  nombreSocio: string;
  nombreNutricionista: string;
  dniSocio: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function DashboardRecepcionista() {
  const { token } = useAuth();

  const { data: turnos = [], isLoading: cargandoTurnos } = useQuery({
    queryKey: ['turnos-recepcion-dia', token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<TurnoRecepcion[]>>(
        '/turnos/recepcion/dia',
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token,
  });

  // Calcular KPIs
  const totalTurnos = turnos.length;
  const checkIns = turnos.filter((t) => t.estadoTurno === 'COMPLETADO').length;
  const pendientes = turnos.filter((t) => t.estadoTurno === 'PENDIENTE').length;
  const cancelados = turnos.filter((t) => t.estadoTurno === 'CANCELADO').length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-orange-500" />
            Panel de Recepción
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Gestión de turnos, check-ins y atención al paciente.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <EstadisticasKpiCard
          titulo="Turnos Hoy"
          valor={totalTurnos}
          icono={<Calendar className="h-4 w-4" />}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Check-ins"
          valor={checkIns}
          icono={<CheckCircle className="h-4 w-4" />}
          badge={checkIns > 0 ? { texto: 'Atendidos', variante: 'success' } : undefined}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Pendientes"
          valor={pendientes}
          icono={<Clock className="h-4 w-4" />}
          badge={pendientes > 0 ? { texto: 'En espera', variante: 'warning' } : undefined}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Cancelados"
          valor={cancelados}
          icono={<XCircle className="h-4 w-4" />}
          cargando={cargandoTurnos}
        />
      </div>

      {/* Grid Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        <TurnosTablaCard />
        <AgendaProfesionalesCard />
        <AccionesRapidasRecepcionCard />
        <UltimosRegistradosCard />
      </div>

      {/* Footer - Resumen */}
      <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong>Resumen del día:</strong> {totalTurnos} turnos programados,{' '}
        {checkIns} pacientes atendidos, {pendientes} en espera.
      </div>
    </div>
  );
}
