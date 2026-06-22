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

interface CatalogoProfesionalResponseDto {
  items: ProfesionalDisponible[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export async function listarProfesionalesDisponiblesPaginado(
  token: string,
  params: { page: number; limit: number; nombre?: string },
): Promise<PaginatedData<ProfesionalDisponible>> {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit));
  if (params.nombre) queryParams.set('nombre', params.nombre);

  const response = await apiRequest<CatalogoProfesionalResponseDto>(
    `/profesional/publico/disponibles?${queryParams.toString()}`,
    { token },
  );

  return {
    data: response.items,
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.per_page,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
      hasNextPage: response.pagination.page < response.pagination.total_pages,
      hasPreviousPage: response.pagination.page > 1,
    },
  };
}
