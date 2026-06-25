/**
 * Hook de React Query para gestionar las preferencias IA persistentes del
 * nutricionista (directrices privadas que se inyectan en cada plan generado).
 *
 * Endpoints:
 * - GET  /profesional/mi-perfil/preferencias-ia   → { preferencias: string }
 * - PUT  /profesional/mi-perfil/preferencias-ia   → { preferencias: string }
 *
 * Cache key: ['profesional', 'preferencias-ia']
 *
 * Tras guardar, actualiza optimistamente el cache para reflejar el nuevo texto.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';

const MAX_CARACTERES_PREFERENCIAS = 2000;

interface RespuestaPreferenciasIa {
  preferencias: string;
}

export function usePreferenciasIa() {
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: ['profesional', 'preferencias-ia'],
    queryFn: async (): Promise<RespuestaPreferenciasIa> => {
      const respuesta = await apiRequest<RespuestaPreferenciasIa>(
        '/profesional/mi-perfil/preferencias-ia',
        { method: 'GET' },
      );
      return { preferencias: respuesta.preferencias ?? '' };
    },
    staleTime: 60_000,
  });

  const preferenciasTexto = consulta.data?.preferencias ?? '';

  const mutacion = useMutation({
    mutationFn: async (preferencias: string): Promise<string> => {
      const sanitizado = preferencias.trim();
      if (sanitizado.length > MAX_CARACTERES_PREFERENCIAS) {
        throw new Error(
          `Las preferencias no pueden superar los ${MAX_CARACTERES_PREFERENCIAS} caracteres`,
        );
      }
      const respuesta = await apiRequest<RespuestaPreferenciasIa>(
        '/profesional/mi-perfil/preferencias-ia',
        {
          method: 'PUT',
          body: { preferencias: sanitizado },
        },
      );
      return respuesta.preferencias ?? '';
    },
    onSuccess: (preferenciasPersistidas) => {
      queryClient.setQueryData<RespuestaPreferenciasIa>(
        ['profesional', 'preferencias-ia'],
        { preferencias: preferenciasPersistidas },
      );
    },
  });

  return {
    preferencias: preferenciasTexto,
    isLoading: consulta.isLoading,
    isError: consulta.isError,
    error: consulta.error,
    guardar: mutacion.mutate,
    guardarAsync: mutacion.mutateAsync,
    isSaving: mutacion.isPending,
    errorGuardado: mutacion.error,
    guardadoOk: mutacion.isSuccess,
  };
}