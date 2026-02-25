import { Heart, Calendar, Activity, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { EstadisticasKpiCard } from '@/components/dashboard/EstadisticasKpiCard';
import { PlanAlimenticioCard } from '@/components/dashboard/PlanAlimenticioCard';
import { GraficoProgresoCard } from '@/components/dashboard/GraficoProgresoCard';
import { ObjetivosCard } from '@/components/dashboard/ObjetivosCard';
import { AccionesRapidasSocioCard } from '@/components/dashboard/AccionesRapidasSocioCard';
import { MensajeMotivacional } from '@/components/dashboard/MensajeMotivacional';

interface MiTurno {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  profesionalId: number;
  profesionalNombreCompleto: string;
  especialidad: string;
}

interface ResumenProgreso {
  pesoActual: number | null;
  pesoObjetivo: number | null;
  imc: number | null;
  clasificacionImc: string | null;
  ultimaMedicion: string | null;
}

export function DashboardSocio() {
  const { token } = useAuth();

  // KPIs - Turnos
  const { data: turnosResponse, isLoading: cargandoTurnos } = useQuery({
    queryKey: ['mis-turnos', token],
    queryFn: () => apiRequest<{ data: MiTurno[] }>('/turnos/socio/mis-turnos', { token }),
    enabled: !!token,
  });

  // KPIs - Progreso
  const { data: progreso, isLoading: cargandoProgreso } = useQuery({
    queryKey: ['mi-progreso', token],
    queryFn: () => apiRequest<ResumenProgreso>('/turnos/socio/mi-progreso', { token }),
    enabled: !!token,
  });

  // Asegurar que turnos sea siempre un array
  const turnos = Array.isArray(turnosResponse) ? turnosResponse : (turnosResponse?.data ?? []);

  // Calcular proximo turno
  const proximoTurno = turnos
    .filter((t) => t.estadoTurno !== 'CANCELADO' && t.estadoTurno !== 'COMPLETADO')
    .sort((a, b) => {
      const fechaA = new Date(`${a.fechaTurno}T${a.horaTurno}`);
      const fechaB = new Date(`${b.fechaTurno}T${b.horaTurno}`);
      return fechaA.getTime() - fechaB.getTime();
    })[0];

  // Calcular progreso hacia objetivo
  const pesoRestante =
    progreso?.pesoActual && progreso?.pesoObjetivo
      ? Math.abs(progreso.pesoActual - progreso.pesoObjetivo)
      : null;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <Heart className="h-8 w-8 text-orange-500" />
            Mi Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Tu espacio personal para seguir tu progreso y plan nutricional.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <EstadisticasKpiCard
          titulo="Proximo Turno"
          valor={proximoTurno ? proximoTurno.fechaTurno : 'Sin turnos'}
          descripcion={proximoTurno ? `${proximoTurno.horaTurno} hs` : undefined}
          icono={<Calendar className="h-4 w-4" />}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Mi IMC"
          valor={progreso?.imc ? progreso.imc.toFixed(1) : '-'}
          descripcion={progreso?.clasificacionImc || 'Sin datos'}
          icono={<Activity className="h-4 w-4" />}
          cargando={cargandoProgreso}
        />
        <EstadisticasKpiCard
          titulo="Progreso"
          valor={pesoRestante !== null ? `${pesoRestante.toFixed(1)} kg` : '-'}
          descripcion={pesoRestante !== null ? 'para objetivo' : 'Sin objetivo'}
          icono={<Target className="h-4 w-4" />}
          cargando={cargandoProgreso}
        />
      </div>

      {/* Grid Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        <PlanAlimenticioCard />
        <GraficoProgresoCard />
        <ObjetivosCard />
        <MensajeMotivacional />
      </div>

      {/* Footer - Acciones */}
      <AccionesRapidasSocioCard />
    </div>
  );
}
