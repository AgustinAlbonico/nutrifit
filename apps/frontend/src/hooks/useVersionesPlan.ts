/**
 * Hook de React Query para listar las versiones inmutables de un plan
 * de alimentación.
 *
 * Endpoint: GET /planes-alimentacion/:id/versiones
 * Cache key: ['planes-alimentacion', planId, 'versiones']
 * staleTime: 30s — la lista no cambia tan seguido.
 *
 * El endpoint devuelve el resumen (sin `datosJson` pesado) ordenado por
 * numeroVersion DESC. La activación/regeneración de una versión se hace
 * desde otros endpoints y se invalida esta query.
 */

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { RespuestaVersionesPlanFE, VersionPlanFE } from '@/types/ia';

export function useVersionesPlan(planId: number) {
  return useQuery({
    queryKey: ['planes-alimentacion', planId, 'versiones'],
    queryFn: async (): Promise<VersionPlanFE[]> => {
      const respuesta = await apiRequest<RespuestaVersionesPlanFE>(
        `/planes-alimentacion/${planId}/versiones`,
        { method: 'GET' },
      );
      return respuesta.versiones ?? [];
    },
    enabled: Number.isFinite(planId) && planId > 0,
    staleTime: 30_000,
  });
}