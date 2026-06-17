import type { Genero } from './genero';
export type { Genero };

export interface Socio {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  genero: Genero;
  direccion: string;
  ciudad: string;
  provincia: string;
  email: string;
  fechaBaja: string | null;
  activo: boolean;
  fotoPerfilUrl: string | null;
  observaciones: string | null;
}

export interface CrearSocioDto {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  genero: Genero;
  direccion: string;
  ciudad: string;
  provincia: string;
  email: string;
  observaciones?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface CrearSocioResponseDto {
  socio: Socio;
  contrasenaProvisional: string;
}

export interface DesactivarSocioDto {
  motivo: string;
}

export interface DesactivarSocioResultDto {
  message: string;
  turnosCancelados: number;
  nutricionistasAfectados: number;
  tienePlanActivo: boolean;
}
