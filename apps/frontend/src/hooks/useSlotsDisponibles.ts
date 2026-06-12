import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { TurnoDisponibleSlot } from '@/types/asignar-turno';
import { useAuth } from '@/contexts/AuthContext';
import { deduplicarTurnos } from '@/lib/turnos-disponibles';

/**
 * Hook que wrappea el endpoint de disponibilidad del nutricionista
 * segun el rol del actor:
 *
 *  - `RECEPCION` / `ADMIN` -> `GET /turnos/admin/profesional/:id/disponibilidad`
 *  - `NUTRICIONISTA`      -> `GET /turnos/profesional/:id/disponibilidad`
 *
 * Reutiliza `deduplicarTurnos` de `@/lib/turnos-disponibles` para
 * consolidar slots repetidos (misma horaInicio con `LIBRE` y
 * `OCUPADO` -> gana `LIBRE`).
 *
 * El query solo se dispara cuando hay `nutricionistaId` y `fecha`.
 */
export function useSlotsDisponibles(
  nutricionistaId: number | null,
  fecha: Date | undefined,
) {
  const { token, rol } = useAuth();
  const fechaApi = fecha ? format(fecha, 'yyyy-MM-dd') : null;
  const habilitado = Boolean(nutricionistaId) && Boolean(fechaApi) && Boolean(token);

  const query = useQuery<TurnoDisponibleSlot[]>({
    queryKey: [
      'slots-disponibles-asignar',
      rol,
      nutricionistaId,
      fechaApi,
      token,
    ],
    enabled: habilitado,
    staleTime: 15_000,
    queryFn: async () => {
      if (!nutricionistaId || !fechaApi) {
        return [];
      }

      const base =
        rol === 'NUTRICIONISTA'
          ? `/turnos/profesional/${nutricionistaId}/disponibilidad`
          : `/turnos/admin/profesional/${nutricionistaId}/disponibilidad`;

      const response = await apiRequest<ApiResponse<TurnoDisponibleSlot[]>>(
        `${base}?fecha=${fechaApi}`,
        { token },
      );

      return deduplicarTurnos(response.data ?? []) as TurnoDisponibleSlot[];
    },
  });

  return {
    data: habilitado ? (query.data ?? []) : [],
    isLoading: habilitado ? query.isLoading : false,
    error: query.error,
  };
}
