import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

export interface ContextoAccesoRecurso {
  actorPersonaId?: number | null;
  socioId?: number | null;
  turnoId?: number;
}

interface RequestConAccesoRecurso extends Request {
  resourceAccess?: ContextoAccesoRecurso;
}

/**
 * Inyecta el contexto de acceso poblado por `SocioResourceAccessGuard` /
 * guards similares. Lanza ForbiddenException si el guard no se ejecutó.
 */
export const ResourceAccess = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ContextoAccesoRecurso => {
    const request = ctx.switchToHttp().getRequest<RequestConAccesoRecurso>();
    const access = request.resourceAccess;

    if (!access) {
      throw new ForbiddenException('Contexto de acceso no inicializado');
    }

    return access;
  },
);
