/**
 * Hook de React Query para saber si el socio autenticado tiene
 * ficha de salud cargada. Se usa para bloquear el acceso a vistas
 * de turnos (Mis Turnos, Dashboard) cuando la ficha está incompleta.
 *
 * Endpoint: `GET /turnos/socio/ficha-salud`
 * Cache key: `['ficha-salud', 'estado']`
 *
 * Devuelve un estado tri-state:
 * - `fichaCargada === null` mientras carga o si hay error.
 * - `fichaCargada === true` si la ficha existe.
 * - `fichaCargada === false` si la API devolvió `data: null`.
 *
 * RB14: bloqueo de flujo de turnos sin ficha completa.
 */

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

interface EstadoFichaHook {
  cargando: boolean;
  fichaCargada: boolean | null;
  error: Error | null;
}

interface ParametrosEstadoFicha {
  token: string | null;
}

export function useEstadoFichaRequerida({
  token,
}: ParametrosEstadoFicha): EstadoFichaHook {
  const query = useQuery({
    queryKey: ['ficha-salud', 'estado', token],
    queryFn: async () => {
      const respuesta =
        await apiRequest<ApiResponseWrapper<unknown | null>>(
          '/turnos/socio/ficha-salud',
          { method: 'GET', token },
        );
      return respuesta.data;
    },
    enabled: Boolean(token),
    refetchOnWindowFocus: false,
  });

  let fichaCargada: boolean | null = null;
  if (query.data !== undefined) {
    fichaCargada = query.data !== null;
  }

  return {
    cargando: query.isLoading,
    fichaCargada,
    error: query.error as Error | null,
  };
}
