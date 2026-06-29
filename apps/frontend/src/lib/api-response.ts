import type { ApiResponse } from '@/types/api';

export function desenvolverRespuestaApi<T>(
  respuesta: T | ApiResponse<T>,
): T {
  if (esRespuestaApi(respuesta)) {
    return respuesta.data;
  }

  return respuesta;
}

function esRespuestaApi<T>(respuesta: T | ApiResponse<T>): respuesta is ApiResponse<T> {
  return (
    typeof respuesta === 'object' &&
    respuesta !== null &&
    'success' in respuesta &&
    'data' in respuesta
  );
}
