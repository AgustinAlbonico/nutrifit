import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 animate-pulse text-violet-200" />
          <span>Consulta en curso: {turnoActivo.socio.nombreCompleto}</span>
        </div>
        <Button 
          size="sm" 
          variant="secondary" 
          className="h-8 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border-0"
          onClick={() => navigate({ to: `/profesional/consulta/${turnoActivo.idTurno}` })}
        >
          Volver a la consulta
        </Button>
      </div>
    </div>
  );
}