import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { SocioConFicha } from '@/types/asignar-turno';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Hook que busca socios por nombre / apellido / DNI / email para
 * asignarles un turno.
 *
 * Wrapper sobre `GET /socio/buscar-con-ficha?q=...` (mismo endpoint
 * que usa `AsignarTurnoModal`). El query solo se dispara con
 * busquedas de >= 2 caracteres y respeta un debounce de 300ms para
 * evitar requests en cada keystroke.
 *
 * Devuelve `data: []` cuando la busqueda es muy corta, para que
 * los consumidores no tengan que filtrar manualmente.
 */
export function useSociosParaAsignar(busqueda: string) {
  const { token } = useAuth();
  const busquedaDebounceada = useDebounce(busqueda.trim(), 300);
  const habilitada = busquedaDebounceada.length >= 2;

  const query = useQuery<SocioConFicha[]>({
    queryKey: ['socios-buscar-asignar', busquedaDebounceada, token],
    enabled: habilitada && Boolean(token),
    staleTime: 30_000,
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<SocioConFicha[]>>(
        `/socio/buscar-con-ficha?q=${encodeURIComponent(busquedaDebounceada)}`,
        { token },
      );
      return response.data ?? [];
    },
  });

  return {
    data: habilitada ? (query.data ?? []) : [],
    isLoading: habilitada ? query.isLoading : false,
    error: query.error,
  };
}
