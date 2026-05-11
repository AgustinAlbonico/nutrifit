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
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { ObjetivoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/objetivo.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';

type RequestWithAccess = Request & {
  body: Record<string, unknown>;
  resourceAccess?: {
    actorPersonaId: number | null;
    socioId: number | null;
    turnoId?: number;
  };
  user?: {
    id?: number;
    rol?: Rol;
  };
};

@Injectable()
export class SocioResourceAccessGuard implements CanActivate {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepository: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(FotoProgresoOrmEntity)
    private readonly fotoRepository: Repository<FotoProgresoOrmEntity>,
    @InjectRepository(ObjetivoOrmEntity)
    private readonly objetivoRepository: Repository<ObjetivoOrmEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAccess>();
    const user = request.user;

    if (!user?.rol) {
      throw new ForbiddenException('No autorizado');
    }

    if (user.rol === Rol.ADMIN) {
      const socioId = await this.resolveTargetSocioId(request);
      this.attachAccessContext(request, null, socioId);
      return true;
    }

    const actorPersonaId = await this.resolveActorPersonaId(user.id);
    const targetSocioId = await this.resolveTargetSocioId(request);
    const socioId = targetSocioId ?? actorPersonaId;

    this.attachAccessContext(request, actorPersonaId, socioId);

    if (user.rol === Rol.RECEPCIONISTA) {
      throw new ForbiddenException(
        'Recepción no puede acceder a contenido clínico o de progreso.',
      );
    }

    if (user.rol === Rol.ENTRENADOR) {
      throw new ForbiddenException(
        'Entrenador no tiene acceso a este recurso clínico.',
      );
    }

    if (user.rol === Rol.SOCIO) {
      if (socioId !== actorPersonaId) {
        throw new ForbiddenException(
          'Solo podés acceder a tus propios recursos.',
        );
      }

      return true;
    }

    if (user.rol !== Rol.NUTRICIONISTA) {
      throw new ForbiddenException('No autorizado');
    }

    const totalTurnos = await this.turnoRepository.count({
      where: {
        nutricionista: { idPersona: actorPersonaId },
        socio: { idPersona: socioId },
      },
    });

    if (totalTurnos === 0) {
      throw new ForbiddenException(
        'No tenés permisos para acceder a recursos de un socio sin vínculo.',
      );
    }

    return true;
  }

  private async resolveActorPersonaId(userId?: number): Promise<number> {
    if (!userId) {
      throw new ForbiddenException('No autorizado');
    }

    const personaId =
      await this.usuarioRepository.findPersonaIdByUserId(userId);

    if (!personaId) {
      throw new ForbiddenException('No autorizado');
    }

    return personaId;
  }

  private async resolveTargetSocioId(
    request: RequestWithAccess,
  ): Promise<number | null> {
    const body = request.body as Record<string, unknown>;
    const socioIdParam = this.parseOptionalNumber(
      request.params?.socioId,
      'Parámetro de socio inválido',
    );
    const bodySocioId = this.parseOptionalNumber(
      body.socioId,
      'Socio inválido en el body',
    );

    let resourceSocioId: number | null = null;

    if (request.params?.fotoId !== undefined) {
      resourceSocioId = await this.resolveFotoSocioId(request.params.fotoId);
    } else if (request.params?.objetivoId !== undefined) {
      resourceSocioId = await this.resolveObjetivoSocioId(
        request.params.objetivoId,
      );
    } else if (
      request.params?.id !== undefined &&
      request.baseUrl.includes('/planes-alimentacion')
    ) {
      resourceSocioId = await this.resolvePlanSocioId(request.params.id);
    }

    if (
      socioIdParam !== null &&
      resourceSocioId !== null &&
      socioIdParam !== resourceSocioId
    ) {
      throw new ForbiddenException(
        'El recurso no pertenece al socio indicado.',
      );
    }

    if (
      socioIdParam !== null &&
      bodySocioId !== null &&
      socioIdParam !== bodySocioId
    ) {
      throw new ForbiddenException(
        'El socio de la ruta no coincide con el socio del body.',
      );
    }

    return socioIdParam ?? resourceSocioId ?? bodySocioId;
  }

  private async resolvePlanSocioId(planIdValue: unknown): Promise<number> {
    const planId = this.parseRequiredNumber(
      planIdValue,
      'Parámetro de plan inválido',
    );
    const plan = await this.planRepository.findOne({
      where: { idPlanAlimentacion: planId },
      relations: { socio: true },
    });

    if (!plan?.socio?.idPersona) {
      throw new NotFoundException('Plan de alimentación no encontrado');
    }

    return plan.socio.idPersona;
  }

  private async resolveFotoSocioId(fotoIdValue: unknown): Promise<number> {
    const fotoId = this.parseRequiredNumber(
      fotoIdValue,
      'Parámetro de foto inválido',
    );
    const foto = await this.fotoRepository.findOne({
      where: { idFoto: fotoId },
      relations: { socio: true },
    });

    if (!foto?.socio?.idPersona) {
      throw new NotFoundException('Foto de progreso no encontrada');
    }

    return foto.socio.idPersona;
  }

  private async resolveObjetivoSocioId(
    objetivoIdValue: unknown,
  ): Promise<number> {
    const objetivoId = this.parseRequiredNumber(
      objetivoIdValue,
      'Parámetro de objetivo inválido',
    );
    const objetivo = await this.objetivoRepository.findOne({
      where: { idObjetivo: objetivoId },
      relations: { socio: true },
    });

    if (!objetivo?.socio?.idPersona) {
      throw new NotFoundException('Objetivo no encontrado');
    }

    return objetivo.socio.idPersona;
  }

  private parseOptionalNumber(value: unknown, message: string): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ForbiddenException(message);
    }

    return parsed;
  }

  private parseRequiredNumber(value: unknown, message: string): number {
    const parsed = this.parseOptionalNumber(value, message);

    if (parsed === null) {
      throw new ForbiddenException(message);
    }

    return parsed;
  }

  private attachAccessContext(
    request: RequestWithAccess,
    actorPersonaId: number | null,
    socioId: number | null,
  ): void {
    request.resourceAccess = {
      ...request.resourceAccess,
      actorPersonaId,
      socioId,
    };
  }
}
