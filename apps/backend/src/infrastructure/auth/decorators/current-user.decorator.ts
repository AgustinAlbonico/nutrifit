import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Rol } from 'src/domain/entities/Usuario/Rol';

export interface UsuarioAutenticadoPayload {
  id: number;
  email: string;
  rol: Rol;
  acciones?: string[];
  gimnasioId: number | null;
  personaId: number | null;
  jti: string;
  /** Expiracion del JWT en epoch seconds (presente cuando el guard lo expone). */
  exp?: number;
}

interface RequestConUsuario extends Request {
  user?: UsuarioAutenticadoPayload;
}

/**
 * Inyecta el payload completo del usuario autenticado.
 * Lanza UnauthorizedException si no hay usuario en la request.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticadoPayload => {
    const request = ctx.switchToHttp().getRequest<RequestConUsuario>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return user;
  },
);

/**
 * Inyecta solo el id del usuario autenticado.
 * Lanza UnauthorizedException si no hay usuario en la request.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<RequestConUsuario>();
    const user = request.user;
    const id = user?.id;

    if (!id) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return id;
  },
);
