/**
 * Hook de React Query para obtener los datos completos de una versión
 * específica de la ficha de salud del socio.
 *
 * Endpoint: `GET /turnos/socio/ficha-salud/version/:n`
 * Cache key: `['ficha-salud', 'version', n]`
 *
 * La query está deshabilitada cuando `n` es `null` (sin versión seleccionada
 * todavía). Tan pronto se pasa un número, se ejecuta la petición.
 *
 * RBs: RB50 (versionado inmutable).
 */

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { DatosVersion } from '@/types/ficha-salud';

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

interface ParametrosObtenerVersion {
  token: string | null;
  n: number | null;
}

export function useObtenerVersionFicha({ token, n }: ParametrosObtenerVersion) {
  return useQuery({
    queryKey: ['ficha-salud', 'version', n, token],
    queryFn: async (): Promise<DatosVersion> => {
      if (n == null) {
        throw new Error('Versión no especificada');
      }
      const respuesta = await apiRequest<ApiResponseWrapper<DatosVersion>>(
        `/turnos/socio/ficha-salud/version/${n}`,
        { method: 'GET', token },
      );
      return respuesta.data;
    },
    enabled: n != null && Boolean(token),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
