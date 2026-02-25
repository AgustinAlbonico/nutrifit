import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type {
  RespuestaIA,
  RecomendacionComida,
  PlanSemanalIA,
  SustitucionAlimento,
  AnalisisNutricional,
  ParametrosRecomendacion,
  ParametrosPlanSemanal,
  ParametrosSustitucion,
  ParametrosAnalisis,
} from '@/types/ia';

interface UseIaOptions {
  token: string | null;
}

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export function useGenerarRecomendacion({ token }: UseIaOptions) {
  return useMutation({
    mutationFn: async (params: ParametrosRecomendacion): Promise<RespuestaIA<RecomendacionComida[]>> => {
      const response = await apiRequest<ApiResponseWrapper<RespuestaIA<RecomendacionComida[]>>>(
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
      const response = await apiRequest<ApiResponseWrapper<RespuestaIA<PlanSemanalIA>>>(
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
      const response = await apiRequest<ApiResponseWrapper<RespuestaIA<SustitucionAlimento>>>(
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
      const response = await apiRequest<ApiResponseWrapper<RespuestaIA<AnalisisNutricional>>>(
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

export function useVerificarConexionIa({ token }: UseIaOptions) {
  return useQuery({
    queryKey: ['ia', 'conexion'],
    queryFn: async (): Promise<boolean> => {
      try {
        const response = await apiRequest<{ disponible: boolean }>('/ia/estado', {
          method: 'GET',
          token,
        });
        return response.disponible;
      } catch {
        return false;
      }
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}
