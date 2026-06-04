import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Inyecta el payload completo del usuario autenticado.
 * Lanza UnauthorizedException si no hay usuario en la request.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): // @ts-ignore - augmentación Express namespace
  Express.AuthenticatedUserPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    // @ts-ignore - augmentación Express namespace
    const user = request.user as Express.AuthenticatedUserPayload | undefined;

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
    const request = ctx.switchToHttp().getRequest<Request>();
    // @ts-ignore - augmentación Express namespace
    const user = request.user as Express.AuthenticatedUserPayload | undefined;
    const id = user?.id;

    if (!id) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return id;
  },
);
