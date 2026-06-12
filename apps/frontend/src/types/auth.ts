import type { Rol } from '@nutrifit/shared';
export type { Rol };

export interface LoginResponse {
  token: string;
  rol: Rol;
  acciones: string[];
}
