import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type {
  PayloadCreacionTurnoStaff,
  ResultadoCreacionTurnoStaff,
} from '@/types/asignar-turno';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook de mutacion para `POST /turnos/crear`. Crea un turno en
 * nombre de un socio para un nutricionista dado.
 *
 * En `onSuccess` invalida las queries que muestran turnos del
 * gimnasio (`turnos-recepcion-dia`, `agenda-diaria`) y la lista de
 * turnos del socio (`mis-turnos`) para que las pantallas
 * downstream reflejen el nuevo turno al instante.
 */
export function useCrearTurnoEnNombreDeSocio() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ResultadoCreacionTurnoStaff, Error, PayloadCreacionTurnoStaff>({
    mutationFn: async (payload) => {
      const response = await apiRequest<
        ApiResponse<ResultadoCreacionTurnoStaff>
      >('/turnos/crear', {
        method: 'POST',
        token,
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['turnos-recepcion-dia'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-diaria'] });
      queryClient.invalidateQueries({ queryKey: ['mis-turnos', data.socioId] });
    },
  });
}
