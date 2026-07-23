// infrastructure/guards/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  IJwtService,
  JWT_SERVICE,
  JwtPayload,
} from 'src/domain/services/jwt.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { Request } from 'express';
import {
  TOKEN_REVOCADO_REPOSITORY,
  TokenRevocadoRepository,
} from 'src/domain/repositories/token-revocado.repository';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    @Inject(JWT_SERVICE) private readonly jwtService: IJwtService,
    @Inject(TOKEN_REVOCADO_REPOSITORY)
    private readonly tokenRevocadoRepository: TokenRevocadoRepository,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);

      // Validar que el token tenga los campos requeridos para tenant isolation.
      // SUPERADMIN puede no tener gimnasioId (operar cross-tenant).
      if (
        payload.rol !== Rol.SUPERADMIN &&
        (payload.gimnasioId === undefined || payload.gimnasioId === null)
      ) {
        throw new UnauthorizedException('Token sin contexto de tenant');
      }
    } catch (error) {
      // Let NestJS HTTP exceptions (like tenant validation) pass through unchanged
      if (error instanceof HttpException) throw error;
      throw new UnauthorizedException('Token inválido');
    }

    // Verificacion de blacklist contra la tabla token_revocado.
    // Fail-open: si la consulta falla (tabla inexistente, DB caida, etc.),
    // permitimos el acceso y logueamos warning. Asi no rompemos funcionalidad
    // ante errores de infraestructura transitorios.
    const revocado = await this.verificarRevocado(payload.jti);
    if (revocado) {
      throw new UnauthorizedException('Sesión revocada');
    }

    // Attach user to request — use bracket notation to avoid type conflict with Request.user
    (req as any).user = payload;
    return true;
  }

  private async verificarRevocado(jti: string): Promise<boolean> {
    try {
      return await this.tokenRevocadoRepository.existeJti(jti);
    } catch (error) {
      this.logger.warn(
        `No se pudo verificar blacklist de jti: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
