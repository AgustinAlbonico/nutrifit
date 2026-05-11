import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';

type RequestWithAccess = Request & {
  resourceAccess?: {
    actorPersonaId?: number | null;
    socioId?: number | null;
    turnoId?: number;
  };
  user?: {
    id?: number;
    rol?: Rol;
  };
};

@Injectable()
export class TurnoNutricionistaAccessGuard implements CanActivate {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAccess>();
    const user = request.user;
    const turnoId = this.resolveTurnoId(request);

    if (turnoId === null) {
      return true;
    }

    if (user?.rol === Rol.ADMIN) {
      request.resourceAccess = {
        ...request.resourceAccess,
        turnoId,
      };
      return true;
    }

    if (user?.rol !== Rol.NUTRICIONISTA || !user?.id) {
      throw new ForbiddenException('No autorizado');
    }

    const actorPersonaId = await this.usuarioRepository.findPersonaIdByUserId(
      user.id,
    );

    if (!actorPersonaId) {
      throw new ForbiddenException('No autorizado');
    }

    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: { nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (turno.nutricionista?.idPersona !== actorPersonaId) {
      throw new ForbiddenException(
        'No tenés permisos para operar sobre un turno ajeno.',
      );
    }

    request.resourceAccess = {
      ...request.resourceAccess,
      actorPersonaId,
      turnoId,
    };

    return true;
  }

  private resolveTurnoId(request: RequestWithAccess): number | null {
    const value = request.params?.turnoId ?? request.params?.id;

    if (value === undefined || value === null || value === '') {
      return null;
    }

    const turnoId = Number(value);

    if (!Number.isInteger(turnoId) || turnoId <= 0) {
      throw new ForbiddenException('Parámetro de turno inválido');
    }

    return turnoId;
  }
}
