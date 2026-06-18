import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { EstadoTurno } from '@nutrifit/shared';

interface TurnoDelDia {
  idTurno: number;
  estadoTurno: EstadoTurno;
  socio: {
    nombreCompleto: string;
  };
}

export function BannerConsultaActiva() {
  const { token, rol, personaId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // No mostrar si no es nutricionista o si ya esta en la vista de consulta
  const esNutricionista = rol === 'NUTRICIONISTA';
  const estaEnConsulta = location.pathname.includes('/profesional/consulta/');
  
  const { data: turnos = [] } = useQuery({
    queryKey: ['turnos-del-dia', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<TurnoDelDia[]>>(
        `/turnos/profesional/${personaId}/hoy`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId && esNutricionista && !estaEnConsulta,
    // Refresco cada 30 segundos para mantener el banner actualizado
    refetchInterval: 30000,
  });

  if (!esNutricionista || estaEnConsulta) return null;

  const turnoActivo = turnos.find((t) => t.estadoTurno === 'EN_CURSO');
  if (!turnoActivo) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div 
        role="button"
        tabIndex={0}
        onClick={() => navigate({ to: `/profesional/consulta/${turnoActivo.idTurno}` })}
        className="group cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 p-1.5 shadow-xl flex items-center gap-3 pr-2 ring-1 ring-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-200"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shadow-inner group-hover:bg-white/30 transition-colors">
          <Activity className="h-5 w-5 animate-pulse text-white" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold text-violet-200 uppercase tracking-wider leading-none">
            En curso
          </span>
          <span className="text-sm font-bold text-white leading-none mt-1 pr-2">
            {turnoActivo.socio.nombreCompleto}
          </span>
        </div>
        <div className="ml-1 rounded-full h-8 px-4 flex items-center justify-center text-xs font-bold bg-white text-violet-700 shadow-sm group-hover:bg-violet-50 transition-colors">
          Volver
        </div>
      </div>
    </div>
  );
}