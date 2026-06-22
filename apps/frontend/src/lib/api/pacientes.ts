import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { PaginatedData } from '@nutrifit/shared';

export interface PacientePaginado {
  socioId: number;
  nombreCompleto: string;
  dni: string;
  objetivo: string | null;
  ultimoTurno: string | null;
  proximoTurno: string | null;
  fotoPerfilUrl: string | null;
}

export async function listarPacientesPaginado(
  token: string,
  personaId: number,
  params: { page: number; limit: number; search?: string },
): Promise<PaginatedData<PacientePaginado>> {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('nombre', params.search);

  const respuesta = await apiRequest<
    PaginatedData<PacientePaginado> | ApiResponse<PaginatedData<PacientePaginado>>
  >(`/turnos/profesional/${personaId}/pacientes?${queryParams.toString()}`, { token });

  if (typeof respuesta === 'object' && respuesta !== null && 'data' in respuesta) {
    return (respuesta as ApiResponse<PaginatedData<PacientePaginado>>).data;
  }

  return respuesta as PaginatedData<PacientePaginado>;
}
