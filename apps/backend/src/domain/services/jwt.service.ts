import { Rol } from '../entities/Usuario/Rol';

export const JWT_SERVICE = Symbol('IJwtService');

export interface IJwtService {
  sign(payload: object): string;
  verify<T extends object>(token: string): T;
}

export interface JwtPayload {
  id: number;
  email: string;
  rol: Rol;
  acciones?: string[];
}
