import { apiRequest } from '@/lib/api';
import type {
  Gimnasio,
  CrearGimnasioConAdminRequest,
  ActualizarGimnasioRequest,
  AdminUser,
  ApiResponse,
} from '@/types/gimnasio';

const API_PATH = '/gimnasios';

export async function listarGimnasios(token: string): Promise<Gimnasio[]> {
  const response = await apiRequest<ApiResponse<Gimnasio[]>>(`${API_PATH}`, {
    token,
  });
  return response.data;
}

export async function obtenerGimnasio(
  id: number,
  token: string,
): Promise<Gimnasio> {
  const response = await apiRequest<ApiResponse<Gimnasio>>(`${API_PATH}/${id}`, {
    token,
  });
  return response.data;
}

export async function crearGimnasio(
  data: CrearGimnasioConAdminRequest,
  token: string,
): Promise<Gimnasio> {
  const response = await apiRequest<ApiResponse<Gimnasio>>(`${API_PATH}`, {
    method: 'POST',
    token,
    body: data,
  });
  return response.data;
}

export async function actualizarGimnasio(
  id: number,
  data: ActualizarGimnasioRequest,
  token: string,
): Promise<Gimnasio> {
  const response = await apiRequest<ApiResponse<Gimnasio>>(
    `${API_PATH}/${id}`,
    {
      method: 'PATCH',
      token,
      body: data,
    },
  );
  return response.data;
}

export async function eliminarGimnasio(
  id: number,
  token: string,
): Promise<void> {
  await apiRequest<ApiResponse<null>>(`${API_PATH}/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function impersonarGimnasio(
  id: number,
  token: string,
): Promise<{
  token: string;
  gimnasio: Gimnasio;
  usuario: { id: number; email: string; rol: string };
  expiraEn: string;
}> {
  const response = await apiRequest<
    ApiResponse<{
      token: string;
      gimnasio: Gimnasio;
      usuario: { id: number; email: string; rol: string };
      expiraEn: string;
    }>
  >(`${API_PATH}/${id}/impersonar`, {
    method: 'POST',
    token,
  });
  return response.data;
}

export async function listarAdminsDeGimnasio(
  gimnasioId: number,
  token: string,
): Promise<AdminUser[]> {
  const response = await apiRequest<ApiResponse<AdminUser[]>>(
    `${API_PATH}/${gimnasioId}/admins`,
    {
      token,
    },
  );
  return response.data;
}
