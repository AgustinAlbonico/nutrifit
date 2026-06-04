import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Inyecta el contexto de acceso poblado por `SocioResourceAccessGuard` /
 * guards similares. Lanza ForbiddenException si el guard no se ejecutó.
 */
export const ResourceAccess = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): // @ts-ignore - augmentación Express namespace
  Express.ResourceAccessContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const access = request.resourceAccess;

    if (!access) {
      throw new ForbiddenException('Contexto de acceso no inicializado');
    }

    return access;
  },
);
