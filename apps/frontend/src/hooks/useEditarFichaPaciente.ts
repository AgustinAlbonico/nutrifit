/**
 * Hook de React Query para que un NUTRICIONISTA edite la ficha de salud
 * de un paciente (socio) desde la página del editor de plan.
 *
 * Endpoint: `PUT /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud`
 * Cache keys invalidadas al éxito: `['ficha-paciente', nutricionistaId, socioId]`
 *                          y:    `['ficha-paciente', nutricionistaId, socioId, 'historial']`
 *
 * Tras guardar, devuelve la ficha actualizada (mismo DTO que el GET) para
 * que el componente muestre el nuevo `versionActual` y el snapshot
 * persistido.
 *
 * Nota: este endpoint NO exige `consentimiento` (RB44). El DTO
 * `EditarFichaPacienteNutricionistaDto` (backend) omite ese campo.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { FichaSaludSocio } from '@/types/ficha-salud';

interface ParametrosEditarFichaPaciente {
  /** ID de persona del nutricionista (sale de la URL del endpoint). */
  nutricionistaId: number;
  /** ID de persona del socio (sale de la URL del endpoint). */
  socioId: number;
  /** Token de autenticación. */
  token: string | null;
}

interface VariablesMutacion {
  /** Payload parcial con los campos editados de la ficha. */
  payload: Partial<Omit< FichaSaludSocio, 'socioId' | 'fichaSaludId'>>;
}

export function useEditarFichaPaciente({
  nutricionistaId,
  socioId,
  token,
}: ParametrosEditarFichaPaciente) {
  const queryClient = useQueryClient();

  const mutacion = useMutation<
    FichaSaludSocio,
    Error,
    VariablesMutacion
  >({
    mutationFn: async ({ payload }) => {
      return apiRequest<FichaSaludSocio>(
        `/turnos/profesional/${nutricionistaId}/pacientes/${socioId}/ficha-salud`,
        {
          method: 'PUT',
          token,
          body: payload,
        },
      );
    },
    onSuccess: (fichaActualizada) => {
      // Invalidar la query principal de la ficha → el componente la
      // vuelve a fetcheay queda consistente con el backend.
      void queryClient.invalidateQueries({
        queryKey: ['ficha-paciente', nutricionistaId, socioId],
      });
      // Refrescar historial de versiones del paciente (nutricionista).
      void queryClient.invalidateQueries({
        queryKey: [
          'ficha-paciente',
          nutricionistaId,
          socioId,
          'historial',
        ],
      });
      // Cachear la respuesta más reciente por si otros componentes la consumen.
      queryClient.setQueryData(
        ['ficha-paciente', nutricionistaId, socioId],
        fichaActualizada,
      );
    },
  });

  return {
    /** Ejecuta la mutación. Devuelve la ficha actualizada. */
    editarFicha: mutacion.mutate,
    /** Versión async (Promise) de la mutación. */
    editarFichaAsync: mutacion.mutateAsync,
    /** `true` mientras se está enviando la petición al backend. */
    isPending: mutacion.isPending,
    /** `true` si la mutación falló (validación, 403, 500, etc.). */
    isError: mutacion.isError,
    /** Error de la última mutación fallida. */
    error: mutacion.error,
    /** `true` si la última mutación fue exitosa. */
    isSuccess: mutacion.isSuccess,
    /** Datos de la última mutación exitosa (FichaSaludSocio). */
    data: mutacion.data,
    /** Reset manual del estado de la mutación (útil al cerrar/cancelar). */
    reset: mutacion.reset,
  };
}