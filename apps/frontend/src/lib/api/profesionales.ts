import { apiRequest } from '@/lib/api';
import type { PaginatedData } from '@nutrifit/shared';

export interface ProfesionalDisponible {
  idPersona: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  ciudad: string;
  provincia: string;
  tarifaSesion: number | string;
  agendaConfigurada: boolean;
}

interface ApiResponseConMeta<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta: {
    timestamp: string;
    pagination?: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
  } | null;
}

export async function listarProfesionalesDisponiblesPaginado(
  token: string,
  params: { page: number; limit: number; nombre?: string },
): Promise<PaginatedData<ProfesionalDisponible>> {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit));
  if (params.nombre) queryParams.set('nombre', params.nombre);

  const response = await apiRequest<ApiResponseConMeta<ProfesionalDisponible[]>>(
    `/profesional/publico/disponibles?${queryParams.toString()}`,
    { token },
  );

  const pag = response.meta?.pagination;

  return {
    data: response.data ?? [],
    pagination: {
      page: pag?.page ?? 1,
      limit: pag?.per_page ?? 12,
      total: pag?.total ?? 0,
      totalPages: pag?.total_pages ?? 1,
      hasNextPage: (pag?.page ?? 1) < (pag?.total_pages ?? 1),
      hasPreviousPage: (pag?.page ?? 1) > 1,
    },
  };
}
