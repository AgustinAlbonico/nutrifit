export type Rol = 'ADMIN' | 'SUPERADMIN' | 'NUTRICIONISTA' | 'SOCIO' | 'RECEPCIONISTA';

export interface LoginResponse {
  token: string;
  rol: Rol;
  acciones: string[];
}
