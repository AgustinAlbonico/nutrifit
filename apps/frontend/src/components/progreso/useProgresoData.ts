import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { HistorialMediciones, ResumenProgreso } from './types';

interface UseProgresoDataOptions {
  socioId?: number;
  nutricionistaId?: number;
  token?: string | null;
  enabled?: boolean;
}

export function useProgresoData(options: UseProgresoDataOptions = {}) {
  const { socioId, nutricionistaId, token, enabled = true } = options;

  // Hook para obtener historial de mediciones
  const historialQuery = useQuery<HistorialMediciones>({
    queryKey: ['paciente', socioId, 'mediciones', nutricionistaId, token],
    queryFn: async () => {
      const endpoint =
        socioId && nutricionistaId
          ? `/turnos/profesional/${nutricionistaId}/pacientes/${socioId}/historial-mediciones`
          : '/turnos/socio/mi-historial-mediciones';
      const response = await apiRequest<{ data: HistorialMediciones }>(endpoint, {
        token,
      });
      return response.data;
    },
    enabled: enabled && !!token,
    staleTime: 15 * 1000, // 15 segundos para permitir revalidación rápida al recargar o navegar
  });

  // Hook para obtener resumen de progreso
  const resumenQuery = useQuery<ResumenProgreso>({
    queryKey: ['paciente', socioId, 'resumen', nutricionistaId, token],
    queryFn: async () => {
      const endpoint =
        socioId && nutricionistaId
          ? `/turnos/profesional/${nutricionistaId}/pacientes/${socioId}/progreso`
          : '/turnos/socio/mi-progreso';
      const response = await apiRequest<{ data: ResumenProgreso }>(endpoint, {
        token,
      });
      return response.data;
    },
    enabled: enabled && !!token,
    staleTime: 15 * 1000, // 15 segundos para permitir revalidación rápida al recargar o navegar
  });

  return {
    historial: historialQuery.data,
    resumen: resumenQuery.data,
    isLoading: historialQuery.isLoading || resumenQuery.isLoading,
    isError: historialQuery.isError || resumenQuery.isError,
    error: historialQuery.error || resumenQuery.error,
    refetch: () => {
      historialQuery.refetch();
      resumenQuery.refetch();
    },
  };
}
