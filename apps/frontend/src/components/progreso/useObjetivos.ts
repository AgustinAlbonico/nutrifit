import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type {
  ListaObjetivos,
  Objetivo,
  CrearObjetivoDto,
  ActualizarObjetivoDto,
  EstadoObjetivo,
} from './types';

export function useObjetivos(socioId: number, token: string | null) {
  return useQuery<ListaObjetivos>({
    queryKey: ['progreso', socioId, 'objetivos', token],
    queryFn: () => apiRequest<ListaObjetivos>(`/progreso/${socioId}/objetivos`, { token }),
    enabled: !!socioId && !!token,
  });
}

export function useCrearObjetivo(socioId: number, token: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Objetivo, Error, CrearObjetivoDto>({
    mutationFn: (dto: CrearObjetivoDto) =>
      apiRequest<Objetivo>(`/progreso/${socioId}/objetivos`, {
        method: 'POST',
        body: dto,
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso', socioId, 'objetivos'] });
    },
  });
}

export function useActualizarObjetivo(socioId: number, token: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Objetivo, Error, { objetivoId: number; dto: ActualizarObjetivoDto }>({
    mutationFn: ({ objetivoId, dto }) =>
      apiRequest<Objetivo>(`/progreso/${socioId}/objetivos/${objetivoId}`, {
        method: 'PATCH',
        body: dto,
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso', socioId, 'objetivos'] });
    },
  });
}

export function useMarcarObjetivo(socioId: number, token: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Objetivo, Error, { objetivoId: number; estado: EstadoObjetivo }>({
    mutationFn: ({ objetivoId, estado }) =>
      apiRequest<Objetivo>(`/progreso/${socioId}/objetivos/${objetivoId}/estado`, {
        method: 'PATCH',
        body: { estado },
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso', socioId, 'objetivos'] });
    },
  });
}
