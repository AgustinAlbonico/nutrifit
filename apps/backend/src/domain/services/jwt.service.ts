import { Rol } from '../entities/Usuario/Rol';

export const JWT_SERVICE = Symbol('IJwtService');

export interface IJwtService {
  sign(payload: object): string;
  verify<T extends object>(token: string): T;
}

export interface JwtPayload {
  /** ID del usuario — puede ser null en tokens emitidos antes de persistir */
  id: number | null;
  email: string;
  rol: Rol;
  acciones?: string[];
  /** ID de la persona associada al usuario (desde persona.idPersona) */
  personaId: number | null;
  /** ID del gimnasio/tenant al que pertenece el usuario */
  gimnasioId: number;
  /** JWT ID — identificador unico del token para revocacion */
  jti: string;
  /** Tiempo de expiracion */
  exp?: number;
}
