import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';

/**
 * Guard para rutas de planes de alimentación.
 *
 * - ADMIN: acceso sin restricciones.
 * - NUTRICIONISTA:
 *     - Rutas con `:socioId` → valida que exista al menos un turno entre
 *       el nutricionista autenticado y ese socio.
 *     - Rutas con `:id` (plan id) → resuelve el socioId del plan y
 *       aplica la misma validación.
 *     - Rutas sin ninguno de estos params → permite el paso (ej: POST sin
 *       param en ruta; la use-case valida socio en el body).
 */
@Injectable()
export class PlanSocioAccessGuard implements CanActivate {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepository: Repository<PlanAlimentacionOrmEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // ADMIN bypasses all ownership checks
    if (user?.rol === Rol.ADMIN) {
      return true;
    }

    // SOCIO: solo puede acceder a sus propios planes (solo lectura)
    if (user?.rol === Rol.SOCIO) {
      const userId: number = user?.id;
      if (!userId) {
        throw new ForbiddenException('No autorizado');
      }

      const socioPersonaId =
        await this.usuarioRepository.findPersonaIdByUserId(userId);

      if (!socioPersonaId) {
        throw new ForbiddenException('No autorizado');
      }

      // Resolver socioId de la ruta
      const socioIdParam = request.params?.socioId;
      let targetSocioId: number | null = null;

      if (socioIdParam !== undefined) {
        targetSocioId = Number(socioIdParam);
      } else {
        const planIdParam = request.params?.id;
        if (planIdParam !== undefined) {
          const planId = Number(planIdParam);
          if (!Number.isFinite(planId)) {
            throw new ForbiddenException('Parámetro de plan inválido');
          }

          const plan = await this.planRepository.findOne({
            where: { idPlanAlimentacion: planId },
            relations: ['socio'],
          });

          if (!plan) {
            throw new NotFoundException('Plan de alimentación no encontrado');
          }

          targetSocioId = (plan.socio as any)?.idPersona ?? null;
        }
      }

      // SOCIO solo puede acceder a sus propios datos
      if (targetSocioId !== null && targetSocioId !== socioPersonaId) {
        throw new ForbiddenException(
          'Solo puedes acceder a tus propios planes de alimentación.',
        );
      }

      return true;
    }

    // NUTRICIONISTA: validación existente
    const userId: number = user?.id;
    if (!userId) {
      throw new ForbiddenException('No autorizado');
    }

    const nutricionistaPersonaId =
      await this.usuarioRepository.findPersonaIdByUserId(userId);

    if (!nutricionistaPersonaId) {
      throw new ForbiddenException('No autorizado');
    }

    // Resolve socioId from route params or request body
    let socioId: number | null = null;

    const socioIdParam = request.params?.socioId;
    if (socioIdParam !== undefined) {
      socioId = Number(socioIdParam);
    } else {
      const planIdParam = request.params?.id;
      if (planIdParam !== undefined) {
        const planId = Number(planIdParam);
        if (!Number.isFinite(planId)) {
          throw new ForbiddenException('Parámetro de plan inválido');
        }

        const plan = await this.planRepository.findOne({
          where: { idPlanAlimentacion: planId },
          relations: ['socio'],
        });

        if (!plan) {
          throw new NotFoundException('Plan de alimentación no encontrado');
        }

        socioId = (plan.socio as any)?.idPersona ?? null;
      } else {
        // Fallback: check request body for socioId (e.g. POST /planes-alimentacion)
        const bodySocioId = (request as any).body?.socioId;
        if (bodySocioId !== undefined) {
          socioId = Number(bodySocioId);
        }
      }
    }

    // No resoluble socioId — allow through
    if (socioId === null) {
      return true;
    }

    if (!Number.isFinite(socioId)) {
      throw new ForbiddenException('Parámetro de socio inválido');
    }

    // Check that at least one turno exists between this nutricionista and the socio
    const turnoCount = await this.turnoRepository.count({
      where: {
        nutricionista: { idPersona: nutricionistaPersonaId },
        socio: { idPersona: socioId },
      },
    });

    if (turnoCount === 0) {
      throw new ForbiddenException(
        'No tenés permisos para acceder a los planes de este socio. ' +
          'Debe existir al menos un turno compartido.',
      );
    }

    return true;
  }
}
