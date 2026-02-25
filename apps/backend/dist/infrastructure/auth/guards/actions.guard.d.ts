import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisosService } from 'src/application/permisos/permisos.service';
export declare class ActionsGuard implements CanActivate {
    private readonly reflector;
    private readonly permisosService;
    constructor(reflector: Reflector, permisosService: PermisosService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
