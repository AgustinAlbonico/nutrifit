import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import type { ApiResponse } from '@/types/api';
import type { NutricionistaActivo } from '@/types/asignar-turno';
import { useAuth } from '@/contexts/AuthContext';

interface RespuestaPaginada<T> {
  data: T[];
  pagination: unknown;
}

type RespuestaHook =
  | ApiResponse<RespuestaPaginada<NutricionistaActivo>>
  | RespuestaPaginada<NutricionistaActivo>;

/**
 * Lista los nutricionistas activos del gimnasio del actor.
 *
 * El backend expone `GET /profesional` (rol `ADMIN` y `RECEPCIONISTA`)
 * con filtro por gimnasio via `TenantContext`. Como la respuesta
 * completa del backend es mas rica que la interfaz
 * `NutricionistaActivo` (incluye matricula, especialidad, etc.),
 * la proyectamos a la forma minima que necesita el wizard.
 *
 * Cache de 5 minutos (staleTime) — la lista de nutricionistas del
 * gimnasio cambia muy rara vez.
 */
export function useNutricionistasParaAsignar(habilitado = true) {
  const { token } = useAuth();

  const query = useQuery<NutricionistaActivo[]>({
    queryKey: ['nutricionistas-activos-asignar', token],
    enabled: habilitado && Boolean(token),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const response = await apiRequest<RespuestaHook>('/profesional', {
        token,
      });
      // Backend shape (controlado por el use case y envuelto por el
      // interceptor ApiResponse): { success, message, data: { data, pagination } }.
      // La UI necesita solo el array de profesionales.
      const paginado = desenvolverRespuestaApi<RespuestaPaginada<NutricionistaActivo>>(
        response as RespuestaHook,
      );
      const items = Array.isArray(paginado?.data) ? paginado.data : [];
      return items.map((item) => ({
        idPersona: item.idPersona,
        nombre: item.nombre,
        apellido: item.apellido,
        nombreCompleto:
          item.nombreCompleto ??
          `${item.nombre} ${item.apellido}`.trim(),
        matricula: item.matricula ?? null,
        especialidad: item.especialidad ?? null,
      }));
    },
  });

  return {
    data: habilitado ? (query.data ?? []) : [],
    isLoading: habilitado ? query.isLoading : false,
    error: query.error,
  };
}
