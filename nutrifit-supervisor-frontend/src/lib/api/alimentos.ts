import { apiRequest } from '@/lib/api';

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

interface ApiRespuesta<T> {
  success: boolean;
  data: T;
}
export async function obtenerGruposAlimenticios(token: string): Promise<GrupoAlimenticio[]> {
  const respuesta = await apiRequest<ApiRespuesta<GrupoAlimenticio[]>>('/alimentos/grupos', { token });
  return respuesta.data ?? [];
}
export async function buscarAlimentosPorGrupo(token: string, grupoId: number, limite = 50): Promise<Alimento[]> {
  const respuesta = await apiRequest<ApiRespuesta<Alimento[]>>(
    `/alimentos?grupoId=${grupoId}&limit=${limite}`,
    { token }
  );
  return respuesta.data ?? [];
}
export async function buscarAlimentosPorTexto(token: string, texto: string, limite = 20): Promise<Alimento[]> {
  const respuesta = await apiRequest<ApiRespuesta<Alimento[]>>(
    `/alimentos?search=${encodeURIComponent(texto)}&limit=${limite}`,
    { token }
  );
  return respuesta.data ?? [];
}
