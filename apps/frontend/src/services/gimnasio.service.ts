import { apiRequest } from '@/lib/api';
import type {
  Gimnasio,
  CrearGimnasioDto,
  ActualizarGimnasioDto,
} from '@/types/gimnasio';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Servicio para gestionar gimnasios (tenants) en el sistema multi-tenant.
 */
export class GimnasioService {
  /**
   * Lista todos los gimnasios disponibles.
   * Solo accesible para SUPERADMIN.
   */
  static async listarGimnasios(token: string): Promise<Gimnasio[]> {
    const response = await apiRequest<ApiResponse<Gimnasio[]>>('/gimnasios', {
      method: 'GET',
      token,
    });
    return response.data;
  }

  /**
   * Obtiene un gimnasio específico por su ID.
   */
  static async obtenerGimnasio(
    id: number,
    token: string,
  ): Promise<Gimnasio> {
    const response = await apiRequest<ApiResponse<Gimnasio>>(
      `/gimnasios/${id}`,
      {
        method: 'GET',
        token,
      },
    );
    return response.data;
  }

  /**
   * Crea un nuevo gimnasio.
   * Solo SUPERADMIN puede crear gimnasios.
   */
  static async crearGimnasio(
    data: CrearGimnasioDto,
    token: string,
  ): Promise<Gimnasio> {
    const response = await apiRequest<ApiResponse<Gimnasio>>('/gimnasios', {
      method: 'POST',
      body: data,
      token,
    });
    return response.data;
  }

  /**
   * Actualiza un gimnasio existente.
   * Solo SUPERADMIN puede actualizar gimnasios.
   */
  static async actualizarGimnasio(
    id: number,
    data: ActualizarGimnasioDto,
    token: string,
  ): Promise<Gimnasio> {
    const response = await apiRequest<ApiResponse<Gimnasio>>(
      `/gimnasios/${id}`,
      {
        method: 'PATCH',
        body: data,
        token,
      },
    );
    return response.data;
  }

  /**
   * Elimina un gimnasio (soft delete).
   * Solo SUPERADMIN puede eliminar gimnasios.
   */
  static async eliminarGimnasio(id: number, token: string): Promise<void> {
    await apiRequest<ApiResponse<null>>(`/gimnasios/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  /**
   * Impersona un gimnasio como SUPERADMIN.
   * Devuelve un nuevo token con el contexto del gimnasio seleccionado.
   */
  static async impersonarGimnasio(
    id: number,
    token: string,
  ): Promise<{ token: string; gimnasio: Gimnasio }> {
    const response = await apiRequest<
      ApiResponse<{ token: string; gimnasio: Gimnasio }>
    >(`/gimnasios/${id}/impersonar`, {
      method: 'POST',
      token,
    });
    return response.data;
  }
}