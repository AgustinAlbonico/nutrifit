import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RespuestaPaginadaNotificaciones } from '@/types/notificacion';

export function useNotificaciones(page = 1, limit = 20) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const lista = useQuery({
    queryKey: ['notificaciones', page, limit, token],
    queryFn: () => apiRequest<RespuestaPaginadaNotificaciones>(`/notificaciones/mias?page=${page}&limit=${limit}`, { token }),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const noLeidas = useQuery({
    queryKey: ['notificaciones-no-leidas', token],
    queryFn: () => apiRequest<{ total: number }>('/notificaciones/mias/no-leidas', { token }),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const marcarLeida = useMutation({
    mutationFn: (id: number) => apiRequest(`/notificaciones/${id}/leer`, { method: 'PATCH', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
    },
  });

  const marcarTodasLeidas = useMutation({
    mutationFn: () => apiRequest('/notificaciones/leer-todas', { method: 'PATCH', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-no-leidas'] });
    },
  });

  return { lista, noLeidas, marcarLeida, marcarTodasLeidas };
}
