import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type {
  ListaObjetivos,
  Objetivo,
  CrearObjetivoDto,
  ActualizarObjetivoDto,
  EstadoObjetivo,
} from './types';

export function useObjetivos(socioId: number, token: string | null) {
  return useQuery<ListaObjetivos>({
    queryKey: ['paciente', socioId, 'objetivos', token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<ListaObjetivos>>(
        `/progreso/${socioId}/objetivos`,
        { token },
      );
      return response.data;
    },
    enabled: !!socioId && !!token,
  });
}

export function useCrearObjetivo(socioId: number, token: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Objetivo, Error, CrearObjetivoDto>({
    mutationFn: async (dto: CrearObjetivoDto) => {
      const response = await apiRequest<ApiResponse<Objetivo>>(
        `/progreso/${socioId}/objetivos`,
        {
          method: 'POST',
          body: dto,
          token,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', socioId, 'objetivos'] });
    },
  });
}

export function useActualizarObjetivo(socioId: number, token: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Objetivo, Error, { objetivoId: number; dto: ActualizarObjetivoDto }>({
    mutationFn: async ({ objetivoId, dto }) => {
      const response = await apiRequest<ApiResponse<Objetivo>>(
        `/progreso/${socioId}/objetivos/${objetivoId}`,
        {
          method: 'PATCH',
          body: dto,
          token,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', socioId, 'objetivos'] });
    },
  });
}

export function useMarcarObjetivo(socioId: number, token: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Objetivo, Error, { objetivoId: number; estado: EstadoObjetivo }>({
    mutationFn: async ({ objetivoId, estado }) => {
      const response = await apiRequest<ApiResponse<Objetivo>>(
        `/progreso/${socioId}/objetivos/${objetivoId}/estado`,
        {
          method: 'PATCH',
          body: { estado },
          token,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', socioId, 'objetivos'] });
    },
  });
}
