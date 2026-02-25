import { Rol } from '../entities/Usuario/Rol';
export declare const JWT_SERVICE: unique symbol;
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
