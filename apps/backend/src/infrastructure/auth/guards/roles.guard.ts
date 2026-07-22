import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { ROLE_KEY } from '../decorators/role.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    rol: Rol;
    gimnasioId: number | null;
    personaId: number | null;
    jti: string;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<RequestWithUser>().user;

    // SUPERADMIN bypassea todo (es el "dueño del sistema").
    // Mismo principio que ActionsGuard: los demás roles deben matchear
    // explícitamente la lista de @Rol requerida.
    if (user?.rol === Rol.SUPERADMIN) {
      return true;
    }

    return requiredRoles.includes(user?.rol);
  }
}
