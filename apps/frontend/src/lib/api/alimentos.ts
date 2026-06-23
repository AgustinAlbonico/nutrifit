import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { PaginatedData } from '@nutrifit/shared';



function extraerDatos<T>(respuesta: T | ApiResponse<T>): T {
  if (typeof respuesta === 'object' && respuesta !== null && 'data' in respuesta) {
    return (respuesta as ApiResponse<T>).data;
  }

  return respuesta as T;
}

/**
 * Cuando el backend devuelve `PaginatedData<T>` envuelto por el interceptor en
 * `ApiResponse<PaginatedData<T>>`, `extraerDatos` deja el resultado como
 * `{ data: T[], pagination }`. Este helper saca el último nivel y devuelve `T[]`,
 * con fallback a array vacío si el shape no es el esperado (defensive).
 */
function extraerArrayPaginado<T>(respuesta: unknown): T[] {
  const nivel1 = extraerDatos<T[] | PaginatedData<T>>(respuesta as never);
  if (Array.isArray(nivel1)) {
    return nivel1;
  }
  if (
    nivel1 &&
    typeof nivel1 === 'object' &&
    'data' in nivel1 &&
    Array.isArray((nivel1 as PaginatedData<T>).data)
  ) {
    return (nivel1 as PaginatedData<T>).data;
  }
  return [];
}

export interface GrupoAlimenticio {
  idGrupoAlimenticio: number;
  descripcion: string;
}

export interface Alimento {
  idAlimento: number;
  nombre: string;
  cantidad: number;
  unidadMedida: string;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  grupoAlimenticio: { id: number; descripcion: string } | null;
}

export async function obtenerGruposAlimenticios(token: string): Promise<GrupoAlimenticio[]> {
  const respuesta = await apiRequest<GrupoAlimenticio[] | ApiResponse<GrupoAlimenticio[]>>(
    '/alimentos/grupos',
    { token },
  );

  return extraerDatos(respuesta);
}

export async function buscarAlimentosPorGrupo(token: string, grupoId: number, limite = 50): Promise<Alimento[]> {
  const respuesta = await apiRequest<unknown>(
    `/alimentos?grupoId=${grupoId}&limit=${limite}`,
    { token },
  );

  return extraerArrayPaginado<Alimento>(respuesta);
}

export async function buscarAlimentosPorTexto(token: string, texto: string, limite = 20): Promise<Alimento[]> {
  const respuesta = await apiRequest<unknown>(
    `/alimentos?search=${encodeURIComponent(texto)}&limit=${limite}`,
    { token },
  );

  return extraerArrayPaginado<Alimento>(respuesta);
}

export async function listarAlimentos(token: string, search?: string, limit = 100): Promise<Alimento[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('limit', String(limit));
  const respuesta = await apiRequest<unknown>(
    `/alimentos?${params.toString()}`,
    { token },
  );

  return extraerArrayPaginado<Alimento>(respuesta);
}

export async function listarAlimentosPaginado(
  token: string,
  params: { page: number; limit: number; search?: string },
): Promise<PaginatedData<Alimento>> {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);

  const respuesta = await apiRequest<
    PaginatedData<Alimento> | ApiResponse<PaginatedData<Alimento>>
  >(`/alimentos?${queryParams.toString()}`, { token });

  return extraerDatos(respuesta);
}

export async function obtenerAlimento(token: string, id: number): Promise<Alimento | null> {
  const respuesta = await apiRequest<Alimento | null | ApiResponse<Alimento | null>>(
    `/alimentos/${id}`,
    { token },
  );

  return extraerDatos(respuesta);
}

export interface CrearAlimentoDto {
  nombre: string;
  cantidad: number;
  unidadMedida: string;
  calorias?: number | null;
  proteinas?: number | null;
  carbohidratos?: number | null;
  grasas?: number | null;
  grupoAlimenticioId?: number | null;
}

export interface ActualizarAlimentoDto {
  nombre?: string;
  cantidad?: number;
  unidadMedida?: string;
  calorias?: number | null;
  proteinas?: number | null;
  carbohidratos?: number | null;
  grasas?: number | null;
  grupoAlimenticioId?: number | null;
}

export async function crearAlimento(token: string, data: CrearAlimentoDto): Promise<Alimento> {
  const respuesta = await apiRequest<Alimento | ApiResponse<Alimento>>('/alimentos', {
    token,
    method: 'POST',
    body: data,
  });

  return extraerDatos(respuesta);
}

export async function actualizarAlimento(token: string, id: number, data: ActualizarAlimentoDto): Promise<Alimento> {
  const respuesta = await apiRequest<Alimento | ApiResponse<Alimento>>(`/alimentos/${id}`, {
    token,
    method: 'PUT',
    body: data,
  });

  return extraerDatos(respuesta);
}

export async function eliminarAlimento(token: string, id: number): Promise<void> {
  await apiRequest<void>(`/alimentos/${id}`, {
    token,
    method: 'DELETE',
  });
}
