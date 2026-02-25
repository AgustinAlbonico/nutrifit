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
    queryKey: ['progreso', 'historial', socioId, nutricionistaId, token],
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
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Hook para obtener resumen de progreso
  const resumenQuery = useQuery<ResumenProgreso>({
    queryKey: ['progreso', 'resumen', socioId, nutricionistaId, token],
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
    staleTime: 5 * 60 * 1000, // 5 minutos
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

export function useHistorialMediciones(
  socioId?: number,
  nutricionistaId?: number,
  token?: string | null,
) {
  return useQuery<HistorialMediciones>({
    queryKey: ['progreso', 'historial', socioId, nutricionistaId, token],
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
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useResumenProgreso(
  socioId?: number,
  nutricionistaId?: number,
  token?: string | null,
) {
  return useQuery<ResumenProgreso>({
    queryKey: ['progreso', 'resumen', socioId, nutricionistaId, token],
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
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}
