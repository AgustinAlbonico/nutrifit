// Tipo Gimnasio (Tenant) para el sistema multi-tenant
export interface Gimnasio {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface CrearGimnasioDto {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
}

export interface ActualizarGimnasioDto {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

export interface RespuestaImpersonacion {
  token: string;
  gimnasio: Gimnasio;
  expiraEn: string;
}