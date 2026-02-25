import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IJwtService } from 'src/domain/services/jwt.service';
export declare class JwtAuthGuard implements CanActivate {
    private readonly jwtService;
    private readonly reflector;
    constructor(jwtService: IJwtService, reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
