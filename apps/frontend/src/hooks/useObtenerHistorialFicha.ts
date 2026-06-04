/**
 * Hook de React Query para obtener el historial de versiones de la ficha
 * de salud del socio autenticado.
 *
 * Endpoint: `GET /turnos/socio/ficha-salud/historial`
 * Cache key: `['ficha-salud', 'historial']`
 *
 * Por defecto la query está deshabilitada (`enabled: false`): el hook solo
 * fetchea cuando se invoca `refetch()` (al abrir el modal de historial)
 * o cuando el consumidor cambia `enabled` a `true`.
 *
 * RBs: RB50 (versionado inmutable).
 */

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { HistorialItem } from '@/types/ficha-salud';

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

interface ParametrosObtenerHistorial {
  token: string | null;
  habilitado?: boolean;
}

export function useObtenerHistorialFicha({
  token,
  habilitado = false,
}: ParametrosObtenerHistorial) {
  return useQuery({
    queryKey: ['ficha-salud', 'historial', token],
    queryFn: async (): Promise<HistorialItem[]> => {
      const respuesta =
        await apiRequest<ApiResponseWrapper<HistorialItem[]>>(
          '/turnos/socio/ficha-salud/historial',
          { method: 'GET', token },
        );
      return respuesta.data;
    },
    enabled: Boolean(token) && habilitado,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
