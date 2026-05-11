import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';

type RequestWithUser = Request & {
  user?: {
    id?: number;
    rol?: Rol;
  };
};

@Injectable()
export class NutricionistaOwnershipGuard implements CanActivate {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (user?.rol === Rol.ADMIN) {
      return true;
    }

    const nutricionistaIdParam = request.params?.nutricionistaId;
    if (!nutricionistaIdParam) {
      return true;
    }

    const nutricionistaId = Number(nutricionistaIdParam);
    const userId = user?.id;

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
