import { ACCIONES_METADATA, getCategoriasAcciones, getAccionesPorCategoria } from '@nutrifit/shared';
import type { AccionDescripcion } from '@nutrifit/shared';
import { apiRequest } from '@/lib/api';
import type { GroupDto, ActionDto } from '@/types/permissions';
import type { ApiResponse } from '@/types/api';



/**
 * Servicio para gestionar permisos de usuarios.
 * Endpoints del backend en /permisos/*
 */
export const permisosService = {
  /**
   * Obtiene todos los grupos de permisos disponibles.
   */
  async obtenerGrupos(): Promise<GroupDto[]> {
    const response = await apiRequest<ApiResponse<GroupDto[]>>('/permisos/grupos');
    return response.data ?? [];
  },

  /**
   * Obtiene todas las acciones disponibles.
   */
  async obtenerAcciones(): Promise<ActionDto[]> {
    const response = await apiRequest<ApiResponse<ActionDto[]>>('/permisos/acciones');
    return response.data ?? [];
  },

  /**
   * Obtiene los permisos (grupos y acciones) de un usuario especifico.
   */
  async obtenerPermisosUsuario(usuarioId: number): Promise<{
    grupos: GroupDto[];
    acciones: string[];
  }> {
    const response = await apiRequest<ApiResponse<{
      grupos: GroupDto[];
      acciones: string[];
    }>>(`/permisos/usuarios/${usuarioId}`);
    return response.data ?? { grupos: [], acciones: [] };
  },

  /**
   * Obtiene metadata de acciones (descripciones y categorias).
   */
  obtenerMetadataAcciones(): Record<string, AccionDescripcion> {
    return ACCIONES_METADATA;
  },

  /**
   * Obtiene las categorias disponibles.
   */
  obtenerCategorias(): string[] {
    return getCategoriasAcciones();
  },

  /**
   * Obtiene acciones agrupadas por categoria.
   */
  obtenerAccionesPorCategoria(): Record<string, string[]> {
    return getAccionesPorCategoria();
  },

  /**
   * Asigna un grupo de permisos a un usuario.
   */
  async asignarGrupo(usuarioId: number, grupoId: number): Promise<void> {
    await apiRequest(`/permisos/usuarios/${usuarioId}/grupos`, {
      method: 'POST',
      body: { grupoPermisoId: grupoId },
    });
  },

  /**
   * Quita un grupo de permisos de un usuario.
   */
  async quitarGrupo(usuarioId: number, grupoId: number): Promise<void> {
    await apiRequest(`/permisos/usuarios/${usuarioId}/grupos/${grupoId}`, {
      method: 'DELETE',
    });
  },
};