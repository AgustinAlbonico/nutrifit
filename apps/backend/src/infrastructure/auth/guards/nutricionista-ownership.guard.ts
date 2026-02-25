import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';

@Injectable()
export class NutricionistaOwnershipGuard implements CanActivate {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const nutricionistaIdParam = request.params?.nutricionistaId;
    if (!nutricionistaIdParam) {
      return true;
    }

    const nutricionistaId = Number(nutricionistaIdParam);
    const userId = (request as any).user?.id;

    if (!Number.isFinite(nutricionistaId) || !userId) {
      throw new ForbiddenException('No autorizado');
    }

    const personaId =
      await this.usuarioRepository.findPersonaIdByUserId(userId);

    if (!personaId || personaId !== nutricionistaId) {
      throw new ForbiddenException(
        'No tenes permisos para operar sobre otro profesional.',
      );
    }

    return true;
  }
}
