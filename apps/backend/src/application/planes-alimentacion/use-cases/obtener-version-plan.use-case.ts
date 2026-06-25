import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
  PlanAlimentacionVersionRepository,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import {
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

export interface SolicitudObtenerVersion {
  versionId: number;
  user: {
    id: number;
    rol: Rol;
    personaId: number | null;
    gimnasioId: number | null;
  };
}

export interface RespuestaObtenerVersion {
  id: number;
  planAlimentacionId: number;
  numeroVersion: number;
  motivoCambio: string | null;
  activa: boolean;
  createdAt: string;
  createdBy: number;
  datosJson: PlanAlimentacionDatosJson;
}

/**
 * ObtenerVersionPlanUseCase — devuelve el snapshot completo de una
 * versión de plan con sus datos JSON parseados.
 *
 * Visibilidad:
 *  - NUTRICIONISTA dueño del plan → OK.
 *  - SOCIO titular del plan → solo si la versión está activa=true.
 *  - ADMIN / SUPERADMIN → OK.
 *
 * Restricciones:
 *  - 404 si la versión no existe.
 *  - 403 si el usuario no cumple la regla de visibilidad.
 *  - 403 si el plan pertenece a otro gimnasio.
 */
@Injectable()
export class ObtenerVersionPlanUseCase implements BaseUseCase {
  constructor(
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepo: Repository<NutricionistaOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    solicitud: SolicitudObtenerVersion,
  ): Promise<RespuestaObtenerVersion> {
    const { versionId, user } = solicitud;

    // 1) Cargar versión
    const version = await this.planVersionRepo.obtenerPorId(versionId);
    if (!version) {
      throw new NotFoundError('Versión de plan', String(versionId));
    }

    // 2) Cargar plan padre con socio/nutricionista
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: version.idPlanAlimentacion },
      relations: { nutricionista: true, socio: true },
    });
    if (!plan) {
      throw new NotFoundError(
        'Plan de alimentación',
        String(version.idPlanAlimentacion),
      );
    }

    // 3) Validar gimnasio (multi-tenant)
    if (
      plan.socio &&
      (plan.socio as unknown as { gimnasioId: number | null }).gimnasioId !==
        this.tenantContext.gimnasioId
    ) {
      throw new ForbiddenError('La versión pertenece a otro gimnasio');
    }

    // 4) Validar visibilidad según rol
    this.validarVisibilidad(plan, version, user);

    return {
      id: version.idPlanAlimentacionVersion,
      planAlimentacionId: version.idPlanAlimentacion,
      numeroVersion: version.numeroVersion,
      motivoCambio: version.motivoCambio,
      activa: version.activa,
      createdAt: version.createdAt.toISOString(),
      createdBy: version.createdBy,
      datosJson: version.datosJson,
    };
  }

  private validarVisibilidad(
    plan: PlanAlimentacionOrmEntity,
    version: { activa: boolean },
    user: {
      id: number;
      rol: Rol;
      personaId: number | null;
    },
  ): void {
    if (user.rol === Rol.NUTRICIONISTA) {
      if (
        (plan.nutricionista as unknown as { idPersona: number | null })
          .idPersona !== user.personaId
      ) {
        throw new ForbiddenError(
          'Solo el nutricionista dueño del plan puede ver esta versión',
        );
      }
      return;
    }

    if (user.rol === Rol.SOCIO) {
      if (
        (plan.socio as unknown as { idPersona: number | null }).idPersona !==
        user.personaId
      ) {
        throw new ForbiddenError(
          'Solo el socio titular puede ver esta versión',
        );
      }
      // SOCIO solo ve versiones activas
      if (!version.activa) {
        throw new ForbiddenError(
          'El socio solo puede consultar la versión activa del plan',
        );
      }
      return;
    }

    // ADMIN y SUPERADMIN pasan
  }
}
