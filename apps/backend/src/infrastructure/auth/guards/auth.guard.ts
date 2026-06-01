// infrastructure/guards/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IJwtService, JWT_SERVICE, JwtPayload } from 'src/domain/services/jwt.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_SERVICE) private readonly jwtService: IJwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'] as string;
    if (!authHeader) throw new UnauthorizedException('No token proporcionado');

    const [scheme, token] = authHeader.split(' ');
    if (!token || scheme !== 'Bearer') {
      throw new UnauthorizedException('Formato de token invalido');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      // Validar que el token tenga los campos requeridos para tenant isolation.
      // SUPERADMIN puede no tener gimnasioId (operar cross-tenant).
      if (
        payload.rol !== Rol.SUPERADMIN &&
        (payload.gimnasioId === undefined || payload.gimnasioId === null)
      ) {
        throw new UnauthorizedException('Token sin contexto de tenant');
      }

      // Attach user to request — use bracket notation to avoid type conflict with Request.user
      (req as any).user = payload;
      return true;
    } catch (error) {
      // Let NestJS HTTP exceptions (like tenant validation) pass through unchanged
      if (error instanceof HttpException) throw error;
      throw new UnauthorizedException('Token inválido');
    }
  }
}
