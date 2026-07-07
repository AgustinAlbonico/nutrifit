import { apiRequest } from '@/lib/api';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import type { ApiResponse } from '@/types/api';
import type {
  ConfiguracionIa,
  GuardarConfiguracionIaDto,
  ProveedorIa,
  ResultadoPruebaIa,
  ResultadoReinicioIa,
} from '@/types/iaConfiguracion';

const BASE_PATH = '/admin/ia-configuracion';

export async function obtenerConfiguracionesIa(
  token: string | null,
): Promise<ConfiguracionIa[]> {
  const respuesta = await apiRequest<ApiResponse<ConfiguracionIa[]>>(
    `${BASE_PATH}`,
    { token },
  );
  return desenvolverRespuestaApi<ConfiguracionIa[]>(respuesta) ?? [];
}

export async function obtenerConfiguracionIaPorProvider(
  provider: ProveedorIa,
  token: string | null,
): Promise<ConfiguracionIa | null> {
  try {
    const respuesta = await apiRequest<ApiResponse<ConfiguracionIa>>(
      `${BASE_PATH}/${provider}`,
      { token },
    );
    return desenvolverRespuestaApi<ConfiguracionIa>(respuesta) ?? null;
  } catch {
    return null;
  }
}

export async function guardarConfiguracionIa(
  provider: ProveedorIa,
  dto: GuardarConfiguracionIaDto,
  token: string | null,
): Promise<ConfiguracionIa> {
  const respuesta = await apiRequest<ApiResponse<ConfiguracionIa>>(
    `${BASE_PATH}/${provider}`,
    { method: 'POST', body: dto, token },
  );
  const data = desenvolverRespuestaApi<ConfiguracionIa>(respuesta);
  if (!data) {
    throw new Error('La respuesta del servidor no incluye la configuración guardada.');
  }
  return data;
}

export async function eliminarConfiguracionIa(
  provider: ProveedorIa,
  token: string | null,
): Promise<void> {
  await apiRequest<void>(`${BASE_PATH}/${provider}`, {
    method: 'DELETE',
    token,
  });
}

export async function probarConexionIa(
  provider: ProveedorIa,
  dto: GuardarConfiguracionIaDto | undefined,
  token: string | null,
): Promise<ResultadoPruebaIa> {
  const respuesta = await apiRequest<ApiResponse<ResultadoPruebaIa>>(
    `${BASE_PATH}/${provider}/test`,
    {
      method: 'POST',
      body: dto ?? {},
      token,
    },
  );
  const data = desenvolverRespuestaApi<ResultadoPruebaIa>(respuesta);
  if (!data) {
    throw new Error('La respuesta del servidor no incluye el resultado de la prueba.');
  }
  return data;
}

export async function solicitarReinicioIa(
  token: string | null,
): Promise<ResultadoReinicioIa> {
  const respuesta = await apiRequest<ApiResponse<ResultadoReinicioIa>>(
    `${BASE_PATH}/restart`,
    { method: 'POST', token },
  );
  const data = desenvolverRespuestaApi<ResultadoReinicioIa>(respuesta);
  if (!data) {
    throw new Error('La respuesta del servidor no incluye el resultado del reinicio.');
  }
  return data;
}