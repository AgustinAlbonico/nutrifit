/**
 * Hooks de React Query para el módulo de Inteligencia Artificial.
 *
 * Estructura actual (plan-alimentacion-ia-v2, Packet 5b):
 * - useIa() retorna { generarPlanSemanalV2, regenerarPlanSemanal,
 *   iniciarGeneracionPlanSemanal, cancelarGeneracionPlanIa, generarIdeasComida }
 * - useGeneracionPlanIaActiva, useGeneracionPlanIa: queries de polling.
 *
 * Las mutations legacy (useGenerarRecomendacion, useGenerarPlanSemanal V1,
 * useSugerirSustitucion, useAnalizarPlan, useGenerarIdeasComida) fueron
 * removidas junto con los componentes legacy que las usaban
 * (GeneradorRecomendacion, IdeasComidaPanel, etc.).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import type { ApiResponse } from '@/types/api';
import { traducirErrorApi } from '@/lib/error-messages';
import { toast } from 'sonner';
import type {
  SolicitudPlanSemanalV2FE,
  RespuestaPlanSemanalV2FE,
  GeneracionPlanIaFE,
  SolicitudRegeneracionFE,
  RespuestaRegeneracionFE,
  GenerarIdeasComidaArgs,
  GenerarIdeasComidaRespuesta,
} from '@/types/ia';

interface UseGeneracionPlanIaActivaOptions {
  socioId: number | null | undefined;
  planAlimentacionId?: number | null;
  habilitado?: boolean;
}

interface UseGeneracionPlanIaOptions {
  generacionId: number | null | undefined;
  habilitado?: boolean;
}

interface CancelarGeneracionPlanIaInput {
  generacionId: number;
  socioId?: number;
  planAlimentacionId?: number | null;
}

export function esGeneracionPlanIaActiva(
  generacion: GeneracionPlanIaFE | null | undefined,
): boolean {
  return generacion?.estado === 'PENDIENTE' || generacion?.estado === 'GENERANDO';
}


// ============================================================================
// plan-alimentacion-ia-v2 (Packet 5b)
// ============================================================================

/**
 * Hook que agrupa las mutations de IA para el plan semanal V2.
 *
 * Retorna tres mutations:
 * - `generarPlanSemanalV2`: POST /ia/plan-semanal — versión V2 con validación
 *   de restricciones, validación de macros y versionado inmutable.
 * - `regenerarPlanSemanal`: POST /ia/plan-semanal/regenerar — regeneración
 *   granular por scope (PLAN/DIA/ALTERNATIVA).
 * - `generarIdeasComida`: POST /planes-alimentacion/:id/ideas-comida — genera
 *   ideas de comida para un slot específico del plan.
 *
 * Todas invalidan queries de `['planes-alimentacion']` para refrescar
 * automáticamente listados y versiones en pantalla.
 *
 * Spanish naming — sigue convención del proyecto.
 */
export function useIa() {
  const queryClient = useQueryClient();

  const generarPlanSemanalV2: UseMutationResult<
    RespuestaPlanSemanalV2FE,
    Error,
    SolicitudPlanSemanalV2FE
  > = useMutation({
    mutationFn: async (solicitud: SolicitudPlanSemanalV2FE) => {
      const respuesta = await apiRequest<
        RespuestaPlanSemanalV2FE | ApiResponse<RespuestaPlanSemanalV2FE>
      >('/ia/plan-semanal', {
        method: 'POST',
        body: solicitud,
      });
      return desenvolverRespuestaApi(respuesta);
    },
    onSuccess: (respuesta) => {
      // Invalidar listado general
      queryClient.invalidateQueries({ queryKey: ['planes-alimentacion'] });
      // Invalidar versiones del plan recién creado
      queryClient.invalidateQueries({
        queryKey: ['planes-alimentacion', respuesta.planAlimentacionId, 'versiones'],
      });
    },
  });

  const regenerarPlanSemanal: UseMutationResult<
    RespuestaRegeneracionFE,
    Error,
    SolicitudRegeneracionFE
  > = useMutation({
    mutationFn: async (solicitud: SolicitudRegeneracionFE) => {
      const respuesta = await apiRequest<
        RespuestaRegeneracionFE | ApiResponse<RespuestaRegeneracionFE>
      >('/ia/plan-semanal/regenerar', {
        method: 'POST',
        body: solicitud,
      });
      return desenvolverRespuestaApi(respuesta);
    },
    onSuccess: (respuesta) => {
      // Invalidar listado general
      queryClient.invalidateQueries({ queryKey: ['planes-alimentacion'] });
      // La respuesta no incluye planAlimentacionId directo, pero el plan
      // versionId sí — invalidamos por prefijo de plan-alimentacion
      queryClient.invalidateQueries({
        queryKey: ['plan-alimentacion-version', respuesta.nuevaVersionId],
      });
    },
  });

  const iniciarGeneracionPlanSemanal: UseMutationResult<
    GeneracionPlanIaFE,
    Error,
    SolicitudPlanSemanalV2FE
  > = useMutation({
    mutationFn: async (solicitud: SolicitudPlanSemanalV2FE) => {
      const respuesta = await apiRequest<
        GeneracionPlanIaFE | ApiResponse<GeneracionPlanIaFE>
      >('/ia/plan-semanal/generaciones', {
        method: 'POST',
        body: solicitud,
      });
      return desenvolverRespuestaApi(respuesta);
    },
    onSuccess: (generacion) => {
      queryClient.invalidateQueries({
        queryKey: ['generacion-plan-ia-activa', generacion.socioId],
      });
      queryClient.invalidateQueries({
        queryKey: ['generacion-plan-ia', generacion.id],
      });
    },
  });

  const cancelarGeneracionPlanIa: UseMutationResult<
    GeneracionPlanIaFE,
    Error,
    CancelarGeneracionPlanIaInput
  > = useMutation({
    mutationFn: async ({ generacionId }: CancelarGeneracionPlanIaInput) => {
      const respuesta = await apiRequest<
        GeneracionPlanIaFE | ApiResponse<GeneracionPlanIaFE>
      >(`/ia/plan-semanal/generaciones/${generacionId}/cancelar`, {
        method: 'POST',
      });
      return desenvolverRespuestaApi(respuesta);
    },
    onError: (err) => {
      const errorTraducido = traducirErrorApi(err);
      toast.error(errorTraducido.titulo, { description: errorTraducido.descripcion });
    },
    onSuccess: (generacion, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['generacion-plan-ia', generacion.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['generacion-plan-ia-activa', generacion.socioId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          'generacion-plan-ia-activa',
          variables.socioId ?? generacion.socioId,
          variables.planAlimentacionId ?? generacion.planAlimentacionId ?? null,
        ],
      });
      queryClient.invalidateQueries({ queryKey: ['planes-alimentacion'] });
      toast.success('Generación cancelada');
    },
  });

  const generarIdeasComida: UseMutationResult<
    GenerarIdeasComidaRespuesta,
    Error,
    GenerarIdeasComidaArgs
  > = useMutation({
    mutationFn: async (args: GenerarIdeasComidaArgs) => {
      const respuesta = await apiRequest<
        GenerarIdeasComidaRespuesta | ApiResponse<GenerarIdeasComidaRespuesta>
      >(`/planes-alimentacion/${args.planAlimentacionId}/ideas-comida`, {
        method: 'POST',
        body: args,
      });
      return desenvolverRespuestaApi(respuesta);
    },
    onError: (err) => {
      const errorTraducido = traducirErrorApi(err);
      toast.error(errorTraducido.titulo, { description: errorTraducido.descripcion });
    },
    onSuccess: () => {
      toast.success('Ideas generadas correctamente');
    },
  });

  return {
    generarPlanSemanalV2,
    iniciarGeneracionPlanSemanal,
    cancelarGeneracionPlanIa,
    regenerarPlanSemanal,
    generarIdeasComida,
  };
}

export function useGeneracionPlanIaActiva({
  socioId,
  planAlimentacionId,
  habilitado = true,
}: UseGeneracionPlanIaActivaOptions): UseQueryResult<GeneracionPlanIaFE | null, Error> {
  return useQuery({
    queryKey: ['generacion-plan-ia-activa', socioId, planAlimentacionId ?? null],
    enabled: habilitado && typeof socioId === 'number' && Number.isFinite(socioId),
    refetchInterval: (query) =>
      esGeneracionPlanIaActiva(query.state.data) ? 5_000 : false,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const params = new URLSearchParams({ socioId: String(socioId) });
      if (typeof planAlimentacionId === 'number' && Number.isFinite(planAlimentacionId)) {
        params.set('planAlimentacionId', String(planAlimentacionId));
      }

      const respuesta = await apiRequest<
        GeneracionPlanIaFE | null | ApiResponse<GeneracionPlanIaFE | null>
      >(`/ia/plan-semanal/generaciones/activa?${params.toString()}`);
      return desenvolverRespuestaApi(respuesta);
    },
  });
}

export function useGeneracionPlanIa({
  generacionId,
  habilitado = true,
}: UseGeneracionPlanIaOptions): UseQueryResult<GeneracionPlanIaFE | null, Error> {
  return useQuery({
    queryKey: ['generacion-plan-ia', generacionId ?? null],
    enabled: habilitado && typeof generacionId === 'number' && Number.isFinite(generacionId),
    refetchInterval: (query) => (esGeneracionPlanIaActiva(query.state.data) ? 2_500 : false),
    queryFn: async () => {
      const respuesta = await apiRequest<GeneracionPlanIaFE | ApiResponse<GeneracionPlanIaFE>>(
        `/ia/plan-semanal/generaciones/${generacionId}`,
      );
      return desenvolverRespuestaApi(respuesta);
    },
  });
}
