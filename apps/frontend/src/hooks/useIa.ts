/**
 * Hooks de React Query para el módulo de Inteligencia Artificial.
 *
 * Estructura legacy (componentes previos a plan-alimentacion-ia-v2):
 * - useGenerarRecomendacion
 * - useGenerarPlanSemanal        (LEGACY V1, sin reintentos, sin validación post-gen)
 * - useSugerirSustitucion
 * - useAnalizarPlan
 * - useGenerarIdeasComida
 *
 * Estructura nueva (plan-alimentacion-ia-v2, Packet 5b):
 * - useIa() retorna { generarPlanSemanalV2, regenerarPlanSemanal }
 *
 * Las funciones legacy se conservan porque son usadas por componentes
 * existentes (GeneradorRecomendacion, IdeasComidaPanel, etc.). Las nuevas
 * mutations se exponen a través de un solo hook `useIa()` para mantener
 * una API consistente y limpia para los componentes V2.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import type { ApiResponse } from '@/types/api';
import type {
  RecomendacionComida,
  PlanSemanalIA,
  SustitucionAlimento,
  AnalisisNutricional,
  RespuestaIA,
  ParametrosRecomendacion,
  ParametrosPlanSemanal,
  ParametrosSustitucion,
  ParametrosAnalisis,
  ParametrosIdeasComida,
  RespuestaIdeasComida,
  SolicitudPlanSemanalV2FE,
  RespuestaPlanSemanalV2FE,
  SolicitudRegeneracionFE,
  RespuestaRegeneracionFE,
} from '@/types/ia';

interface UseIaOptions {
  token: string | null;
}

// ============================================================================
// LEGACY — Conservados para componentes pre-existentes
// ============================================================================

export function useGenerarRecomendacion({ token }: UseIaOptions) {
  return useMutation({
    mutationFn: async (params: ParametrosRecomendacion): Promise<RespuestaIA<RecomendacionComida[]>> => {
      const response = await apiRequest<ApiResponse<RespuestaIA<RecomendacionComida[]>>>(
        '/ia/recomendacion',
        {
          method: 'POST',
          token,
          body: params,
        },
      );
      return response.data;
    },
  });
}

export function useGenerarPlanSemanal({ token }: UseIaOptions) {
  return useMutation({
    mutationFn: async (params: ParametrosPlanSemanal): Promise<RespuestaIA<PlanSemanalIA>> => {
      const response = await apiRequest<ApiResponse<RespuestaIA<PlanSemanalIA>>>(
        '/ia/plan-semanal',
        {
          method: 'POST',
          token,
          body: params,
        },
      );
      return response.data;
    },
  });
}

export function useSugerirSustitucion({ token }: UseIaOptions) {
  return useMutation({
    mutationFn: async (params: ParametrosSustitucion): Promise<RespuestaIA<SustitucionAlimento>> => {
      const response = await apiRequest<ApiResponse<RespuestaIA<SustitucionAlimento>>>(
        '/ia/sustitucion',
        {
          method: 'POST',
          token,
          body: params,
        },
      );
      return response.data;
    },
  });
}

export function useAnalizarPlan({ token }: UseIaOptions) {
  return useMutation({
    mutationFn: async (params: ParametrosAnalisis): Promise<RespuestaIA<AnalisisNutricional>> => {
      const response = await apiRequest<ApiResponse<RespuestaIA<AnalisisNutricional>>>(
        '/ia/analisis',
        {
          method: 'POST',
          token,
          body: params,
        },
      );
      return response.data;
    },
  });
}

export function useGenerarIdeasComida({ token }: UseIaOptions) {
  return useMutation({
    mutationFn: async (params: ParametrosIdeasComida): Promise<RespuestaIdeasComida> => {
      const response = await apiRequest<ApiResponse<RespuestaIdeasComida>>(
        '/ia/ideas-comida',
        {
          method: 'POST',
          token,
          body: params,
        },
      );
      return response.data;
    },
  });
}

// ============================================================================
// NUEVO — plan-alimentacion-ia-v2 (Packet 5b)
// ============================================================================

/**
 * Hook que agrupa las mutations de IA para el plan semanal V2.
 *
 * Retorna dos mutations:
 * - `generarPlanSemanalV2`: POST /ia/plan-semanal — versión V2 con validación
 *   de restricciones, validación de macros y versionado inmutable.
 * - `regenerarPlanSemanal`: POST /ia/plan-semanal/regenerar — regeneración
 *   granular por scope (PLAN/DIA/ALTERNATIVA).
 *
 * Ambas invalidan queries de `['planes-alimentacion']` para refrescar
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

  return {
    generarPlanSemanalV2,
    regenerarPlanSemanal,
  };
}
