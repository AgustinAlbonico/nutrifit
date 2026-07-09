import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface RegistroSuscripcionInput {
  gimnasio: {
    nombre: string;
    direccion: string;
    telefono?: string;
    email?: string;
  };
  admin: {
    nombre: string;
    email: string;
    password: string;
  };
}

export interface RegistroSuscripcionOutput {
  gym: { id: number; nombre: string };
  subscription: { id: number; uuid: string; estado: string };
  usuarioId: number;
}

export interface EstadoSuscripcionOutput {
  id: number;
  gimnasioId: number;
  estado: string;
  monto: number;
  fechaInicio: string | null;
  fechaProximoPago: string | null;
  uuid: string;
}

export interface SuscripcionConGymOutput extends EstadoSuscripcionOutput {
  gymNombre: string;
}

export interface ProcesarPagoOutput {
  success: boolean;
  estadoSuscripcion: string;
  mensaje: string;
}

export async function iniciarRegistroSuscripcion(
  data: RegistroSuscripcionInput,
): Promise<RegistroSuscripcionOutput> {
  const response = await apiRequest<ApiResponse<RegistroSuscripcionOutput>>(
    '/suscripciones/registro',
    { method: 'POST', body: data },
  );
  return response.data;
}

export async function procesarPagoSimulado(
  uuid: string,
  accion: 'aprobar' | 'rechazar',
): Promise<ProcesarPagoOutput> {
  const response = await apiRequest<ApiResponse<ProcesarPagoOutput>>(
    `/suscripciones/${uuid}/pagar`,
    { method: 'POST', body: { accion } },
  );
  return response.data;
}

export async function obtenerSuscripcionPorUuid(
  uuid: string,
): Promise<SuscripcionConGymOutput> {
  const response = await apiRequest<ApiResponse<SuscripcionConGymOutput>>(
    `/suscripciones/${uuid}`,
  );
  return response.data;
}

export async function obtenerEstadoSuscripcion(
  gimnasioId: number,
  token: string,
): Promise<EstadoSuscripcionOutput | null> {
  try {
    const response = await apiRequest<ApiResponse<EstadoSuscripcionOutput>>(
      `/suscripciones/gimnasio/${gimnasioId}/estado`,
      { token },
    );
    return response.data;
  } catch {
    return null;
  }
}
