import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { NutricionistaActivo } from '@/types/asignar-turno';
import { useAuth } from '@/contexts/AuthContext';

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
export function useNutricionistasParaAsignar() {
  const { token } = useAuth();

  return useQuery<NutricionistaActivo[]>({
    queryKey: ['nutricionistas-activos-asignar', token],
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<NutricionistaActivo[]>>(
        '/profesional',
        { token },
      );
      const items = response.data ?? [];
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
}
