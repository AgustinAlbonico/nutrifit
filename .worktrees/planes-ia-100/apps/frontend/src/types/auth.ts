export type Rol = 'ADMIN' | 'NUTRICIONISTA' | 'ENTRENADOR' | 'SOCIO' | 'RECEPCIONISTA';

export interface LoginResponse {
  token: string;
  rol: Rol;
  acciones: string[];
}
