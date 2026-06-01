import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { FotoProgreso, GaleriaFotos, TipoFoto } from './types';

interface SubirFotoParams {
  archivo: File;
  tipoFoto: TipoFoto;
  notas?: string;
}

export function useFotosProgreso(socioId: number, token: string | null) {
  return useQuery<GaleriaFotos>({
    queryKey: ['progreso', socioId, 'fotos', token],
    queryFn: () => apiRequest<GaleriaFotos>(`/progreso/${socioId}/fotos`, { token }),
    enabled: !!socioId && !!token,
  });
}

export function useSubirFoto(socioId: number, token: string | null) {
  const queryClient = useQueryClient();

  return useMutation<FotoProgreso, Error, SubirFotoParams>({
    mutationFn: async ({ archivo, tipoFoto, notas }) => {
      const formData = new FormData();
      formData.append('file', archivo);
      formData.append('tipoFoto', tipoFoto);
      if (notas) {
        formData.append('notas', notas);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/progreso/${socioId}/fotos`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error al subir foto' }));
        throw new Error(error.message || 'Error al subir foto');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso', socioId, 'fotos'] });
    },
  });
}

export function useEliminarFoto(socioId: number, token: string | null) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (fotoId: number) => {
      await apiRequest(`/progreso/${socioId}/fotos/${fotoId}`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progreso', socioId, 'fotos'] });
    },
  });
}
