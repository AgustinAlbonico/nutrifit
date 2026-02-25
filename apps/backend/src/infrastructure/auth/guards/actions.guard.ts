import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACTIONS_KEY } from '../decorators/actions.decorator';
import { PermisosService } from 'src/application/permisos/permisos.service';
import { Request } from 'express';
import { Rol } from 'src/domain/entities/Usuario/Rol';

@Injectable()
export class ActionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permisosService: PermisosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredActions =
      this.reflector.getAllAndOverride<string[]>(ACTIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!requiredActions.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request as any).user?.id;

    if (!userId) {
      throw new ForbiddenException('No autorizado');
    }

    if ((request as any).user?.rol === Rol.ADMIN) {
      return true;
    }

    const hasPermission = await this.permisosService.hasAllActions(
      userId,
      requiredActions,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permisos insuficientes: ${requiredActions.join(', ')}`,
      );
    }

    return true;
  }
}
