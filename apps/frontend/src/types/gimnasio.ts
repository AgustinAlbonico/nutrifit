import type { Rol } from '@nutrifit/shared';

export interface Gimnasio {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  fechaCreacion?: Date | string;
}

export interface CrearGimnasioRequest {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
}

export interface CrearGimnasioConAdminRequest extends CrearGimnasioRequest {
  admin: {
    nombre: string;
    email: string;
    contrasena: string;
  };
}

export interface ActualizarGimnasioRequest {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  rol: Rol;
  gimnasioId: number;
  activo: boolean;
  fechaCreacion?: Date | string;
}

export type { ApiResponse } from './api';
