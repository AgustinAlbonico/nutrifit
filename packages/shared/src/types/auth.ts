import type { Rol } from './rol';

export interface TokenPayload {
  sub: number;
  correo: string;
  rol: Rol;
  personaId: number;
}

export interface RespuestaAutenticacion {
  token: string;
  rol: Rol;
  personaId: number;
  correo: string;
  acciones: string[];
}

export interface SesionUsuario {
  id: number;
  correo: string;
  rol: Rol;
  personaId: number;
  acciones: string[];
}
