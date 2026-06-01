export type Rol = 'ADMIN' | 'NUTRICIONISTA' | 'ENTRENADOR' | 'SOCIO' | 'RECEPCIONISTA' | 'SUPERADMIN';

export interface LoginResponse {
  token: string;
  rol: Rol;
  acciones: string[];
  gimnasioId: number | null;
  impersonatedBy: number | null;
}
