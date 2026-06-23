import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
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
} from '@/types/ia';

interface UseIaOptions {
  token: string | null;
}



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
