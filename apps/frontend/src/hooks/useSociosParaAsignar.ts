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
 * Wrapper sobre `GET /socio/buscar-con-ficha?q=...`.
 * El query solo se dispara con busquedas de >= 2 caracteres y
 * respeta un debounce de 300ms para evitar requests en cada keystroke.
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
      return deduplicarSocios(response.data ?? []);
    },
  });

  return {
    data: habilitada ? (query.data ?? []) : [],
    isLoading: habilitada ? query.isLoading : false,
    error: query.error,
  };
}

function deduplicarSocios(socios: SocioConFicha[]): SocioConFicha[] {
  const porId = new Map<number, SocioConFicha>();

  for (const socio of socios) {
    const existente = porId.get(socio.idPersona);

    if (!existente) {
      porId.set(socio.idPersona, socio);
      continue;
    }

    // Si llegaron dos variantes del mismo socio, priorizamos la que
    // tenga ficha completa porque es la mas util para el flujo staff.
    if (!existente.tieneFichaSalud && socio.tieneFichaSalud) {
      porId.set(socio.idPersona, socio);
    }
  }

  return Array.from(porId.values());
}
