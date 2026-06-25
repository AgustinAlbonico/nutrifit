/**
 * Hook de React Query para votar (👍 / 👎) un plan generado por IA.
 *
 * Endpoint: POST /planes-alimentacion/version/:versionId/feedback
 *           PUT  /planes-alimentacion/version/:versionId/feedback
 *
 * Cache key invalidada al éxito: ['plan-feedback', versionId]
 *
 * Tras votar con comentario, el backend crea automáticamente una entrada en
 * la memoria IA del nutricionista (`nutricionista_ia_memoria`). No se hace
 * aquí esa sincronización porque el backend ya la maneja.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { PlanFeedbackFE, SolicitudFeedbackFE } from '@/types/ia';

interface ParametrosVoto {
  voto: 'POSITIVO' | 'NEGATIVO';
  comentario?: string;
}

interface ParametrosHook {
  /** Versión del plan sobre la que se vota. */
  versionId: number;
  /** Si true, usa PUT (edita feedback existente). Si false/undefined, usa POST. */
  editar?: boolean;
}

export function useFeedbackPlan({ versionId, editar = false }: ParametrosHook) {
  const queryClient = useQueryClient();

  const metodo: 'POST' | 'PUT' = editar ? 'PUT' : 'POST';

  const mutacion = useMutation({
    mutationFn: async (parametros: ParametrosVoto): Promise<PlanFeedbackFE> => {
      const cuerpo: SolicitudFeedbackFE = {
        voto: parametros.voto,
        comentario: parametros.comentario,
      };
      return apiRequest<PlanFeedbackFE>(
        `/planes-alimentacion/version/${versionId}/feedback`,
        { method: metodo, body: cuerpo },
      );
    },
    onSuccess: (feedback) => {
      queryClient.setQueryData(['plan-feedback', versionId], feedback);
      queryClient.invalidateQueries({ queryKey: ['plan-feedback', versionId] });
      // Refrescar listado de memoria porque un voto con comentario crea entrada
      queryClient.invalidateQueries({
        queryKey: ['nutricionista-ia', 'memoria'],
      });
    },
  });

  return {
    votar: mutacion.mutate,
    votarAsync: mutacion.mutateAsync,
    isVoting: mutacion.isPending,
    isError: mutacion.isError,
    error: mutacion.error,
    feedback: mutacion.data,
    esExitoso: mutacion.isSuccess,
  };
}