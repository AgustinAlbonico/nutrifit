export type Rol = 'ADMIN' | 'NUTRICIONISTA' | 'SOCIO' | 'RECEPCIONISTA';

export interface LoginResponse {
  token: string;
  rol: Rol;
  acciones: string[];
}
