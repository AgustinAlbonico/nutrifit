import { apiRequest } from '@/lib/api';
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
  const respuesta = await apiRequest<ConfiguracionIa[]>(
    `${BASE_PATH}`,
    { token },
  );
  return respuesta ?? [];
}

export async function obtenerConfiguracionIaPorProvider(
  provider: ProveedorIa,
  token: string | null,
): Promise<ConfiguracionIa | null> {
  try {
    const respuesta = await apiRequest<ConfiguracionIa>(
      `${BASE_PATH}/${provider}`,
      { token },
    );
    return respuesta ?? null;
  } catch {
    return null;
  }
}

export async function guardarConfiguracionIa(
  provider: ProveedorIa,
  dto: GuardarConfiguracionIaDto,
  token: string | null,
): Promise<ConfiguracionIa> {
  return apiRequest<ConfiguracionIa>(`${BASE_PATH}/${provider}`, {
    method: 'POST',
    body: dto,
    token,
  });
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
  return apiRequest<ResultadoPruebaIa>(
    `${BASE_PATH}/${provider}/test`,
    {
      method: 'POST',
      body: dto ?? {},
      token,
    },
  );
}

export async function solicitarReinicioIa(
  token: string | null,
): Promise<ResultadoReinicioIa> {
  return apiRequest<ResultadoReinicioIa>(`${BASE_PATH}/restart`, {
    method: 'POST',
    token,
  });
}