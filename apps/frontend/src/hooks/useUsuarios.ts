import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface Usuario {
  idUsuario: number;
  email: string;
  rol: string;
  persona?: {
    nombre: string;
    apellido: string;
  } | null;
  groups?: Array<{
    id: number;
    nombre: string;
    clave: string;
  }>;
  actions?: Array<{
    id: number;
    clave: string;
    nombre: string;
  }>;
  isActive?: boolean;
  createdAt?: string;
}

export interface GetUsuariosParams {
  token?: string | null;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedUsuariosResponse {
  data: Usuario[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const useUsuarios = (params?: GetUsuariosParams) => {
  const queryClient = useQueryClient();

  // Query: Listar usuarios con paginación y filtros
  const { data, isLoading, error } = useQuery({
    queryKey: ['usuarios', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

      const response = await apiRequest<ApiResponseWrapper<PaginatedUsuariosResponse>>(`/permissions/users?${searchParams.toString()}`, {
        method: 'GET',
        token: params?.token,
      });

      // Extraer datos del wrapper del interceptor API
      return response.data;
    },
    enabled: Boolean(params?.token),
  });

  const usuarios = data?.data || [];
  const pagination = data?.pagination;

  // Query: Obtener usuario por ID
  const useUsuario = (id: number) =>
    useQuery({
      queryKey: ['usuarios', id, params?.token],
      queryFn: async () => {
        const response = await apiRequest<Usuario>(`/permissions/users/${id}`, {
          method: 'GET',
          token: params?.token,
        });
        return response;
      },
      enabled: !!id && Boolean(params?.token),
    });

  // Mutation: Asignar grupos
  const setGruposMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: { groupIds: number[] } }) => {
      const response = await apiRequest(`/permissions/users/${id}/groups`, {
        method: 'PUT',
        token: params?.token,
        body: payload,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });

  // Mutation: Asignar acciones
  const setAccionesMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: { actionIds: number[] } }) => {
      const response = await apiRequest(`/permissions/users/${id}/actions`, {
        method: 'PUT',
        token: params?.token,
        body: payload,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });

  return {
    usuarios,
    pagination,
    isLoading,
    error,
    useUsuario,
    setGrupos: setGruposMutation.mutateAsync,
    setAcciones: setAccionesMutation.mutateAsync,
    isSettingGrupos: setGruposMutation.isPending,
    isSettingAcciones: setAccionesMutation.isPending,
  };
};
