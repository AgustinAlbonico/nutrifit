/**
 * Hook de React Query para obtener la ficha de salud de un paciente
 * desde la perspectiva del nutricionista.
 *
 * Endpoint: `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud`
 * Cache key: `['ficha-paciente', nutricionistaId, socioId]`
 *
 * Solo fetchea cuando nutricionistaId y socioId son válidos y el nutricionista
 * autenticado tiene turno previo con el paciente (el backend valida esto).
 * Si el socio no tiene ficha o el NUT no tiene turno previo, el backend
 * devuelve 404 y este hook expone `error` con la información necesaria
 * para que el componente muestre un mensaje de "sin ficha completada".
 */

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import type { FichaSaludSocio } from '@/types/ficha-salud';
import type { ApiResponse } from '@/types/api';

interface ParametrosObtenerFichaNutricionista {
  token: string | null;
  nutricionistaId: number | null;
  socioId: number | null;
  habilitado?: boolean;
}

export interface ResultadoObtenerFichaNutricionista {
  data: FichaSaludSocio | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  sinFicha: boolean;
  sinPermisos: boolean;
}

export function useObtenerFichaNutricionista({
  token,
  nutricionistaId,
  socioId,
  habilitado = true,
}: ParametrosObtenerFichaNutricionista): ResultadoObtenerFichaNutricionista {
  const query = useQuery<FichaSaludSocio | null, Error>({
    queryKey: ['ficha-paciente', nutricionistaId, socioId],
    enabled:
      habilitado &&
      !!token &&
      !!nutricionistaId &&
      !!socioId,
    queryFn: async () => {
      try {
        const respuesta = await apiRequest<
          FichaSaludSocio | ApiResponse<FichaSaludSocio>
        >(
          `/turnos/profesional/${nutricionistaId}/pacientes/${socioId}/ficha-salud`,
          { token },
        );

        if (
          typeof respuesta === 'object' &&
          respuesta !== null &&
          'data' in respuesta
        ) {
          return (respuesta as ApiResponse<FichaSaludSocio>).data ?? null;
        }
        return (respuesta as FichaSaludSocio | null) ?? null;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('No se pudo obtener la ficha del paciente');
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  // Clasificar el error para que el componente muestre el mensaje correcto:
  // - 403: NUT sin turno previo con el socio (sin permisos para acceder)
  // - 404 con "no encontr*": paciente/socio ajeno o no vinculado al NUT
  // - 404 restante: socio existe pero no tiene ficha completada (caso válido)
  // - otros: error de red u otro
  const errorStatus = (query.error as Error & { status?: number })?.status;
  const errorMensaje = query.error?.message ?? '';
  const errorMensajeNormalizado = errorMensaje.toLowerCase();
  const pacienteNoAccesible =
    errorStatus === 404 &&
    (errorMensajeNormalizado.includes('paciente no encontrado') ||
      errorMensajeNormalizado.includes('socio no encontrado') ||
      errorMensajeNormalizado.includes('paciente no pertenece') ||
      errorMensajeNormalizado.includes('socio no pertenece') ||
      errorMensajeNormalizado.includes('no tenés acceso') ||
      errorMensajeNormalizado.includes('no tenes acceso') ||
      errorMensajeNormalizado.includes('no encontrad'));
  const sinPermisos =
    query.isError &&
    (errorStatus === 403 ||
      pacienteNoAccesible ||
      errorMensajeNormalizado.includes('solo puede acceder'));
  const sinFicha =
    query.isError &&
    !sinPermisos &&
    (errorStatus === 404 ||
      errorMensaje.includes('404') ||
      errorMensaje.includes('no existe') ||
      errorMensaje.includes('No se encontró'));

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    sinFicha,
    sinPermisos,
  };
}
