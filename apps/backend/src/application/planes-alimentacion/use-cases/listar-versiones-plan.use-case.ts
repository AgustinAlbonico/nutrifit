import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanAlimentacionVersionRepository,
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import {
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

export interface SolicitudListarVersiones {
  planAlimentacionId: number;
  user: {
    id: number;
    rol: Rol;
    personaId: number | null;
    gimnasioId: number | null;
  };
}

export interface VersionListadaDTO {
  id: number;
  numeroVersion: number;
  motivoCambio: string | null;
  activa: boolean;
  createdAt: string;
  createdBy: number;
  resumen: {
    diasGenerados: number;
    macrosPromedio: {
      calorias: number;
      proteinas: number;
      carbohidratos: number;
      grasas: number;
    } | null;
  };
}

@Injectable()
export class ListarVersionesPlanUseCase implements BaseUseCase {
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
    solicitud: SolicitudListarVersiones,
  ): Promise<VersionListadaDTO[]> {
    const { planAlimentacionId, user } = solicitud;

    // 1) Cargar plan
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: planAlimentacionId },
      relations: { nutricionista: true, socio: true },
    });

    if (!plan) {
      throw new NotFoundError(
        'Plan de alimentación',
        String(planAlimentacionId),
      );
    }

    // 2) Validar gimnasio
    if (
      plan.socio &&
      (plan.socio as unknown as { gimnasioId: number | null }).gimnasioId !==
        this.tenantContext.gimnasioId
    ) {
      throw new ForbiddenError('El plan pertenece a otro gimnasio');
    }

    // 3) Validar ownership
    if (user.rol === Rol.NUTRICIONISTA) {
      if (
        (plan.nutricionista as unknown as { idPersona: number | null })
          .idPersona !== user.personaId
      ) {
        throw new ForbiddenError(
          'Solo el nutricionista dueño del plan puede listar sus versiones',
        );
      }
    } else if (user.rol === Rol.SOCIO) {
      if (
        (plan.socio as unknown as { idPersona: number | null }).idPersona !==
        user.personaId
      ) {
        throw new ForbiddenError(
          'Solo el socio titular puede listar las versiones de su plan',
        );
      }
    }
    // ADMIN y SUPERADMIN pasan

    // 4) Listar versiones (orden DESC ya está en el repo)
    const versiones =
      await this.planVersionRepo.listarPorPlan(planAlimentacionId);

    return versiones.map((v) => this.mapVersion(v));
  }

  private mapVersion(v: {
    idPlanAlimentacionVersion: number;
    numeroVersion: number;
    motivoCambio: string | null;
    activa: boolean;
    createdAt: Date;
    createdBy: number;
    datosJson: PlanAlimentacionDatosJson;
  }): VersionListadaDTO {
    const dias = v.datosJson?.estructura?.length ?? 0;
    const macrosPromedio = this.calcularMacrosPromedio(
      v.datosJson?.macrosPorDia,
    );

    return {
      id: v.idPlanAlimentacionVersion,
      numeroVersion: v.numeroVersion,
      motivoCambio: v.motivoCambio,
      activa: v.activa,
      createdAt: v.createdAt.toISOString(),
      createdBy: v.createdBy,
      resumen: {
        diasGenerados: dias,
        macrosPromedio,
      },
    };
  }

  private calcularMacrosPromedio(
    macrosPorDia:
      | Record<
          string,
          {
            calorias: number;
            proteinas: number;
            carbohidratos: number;
            grasas: number;
          }
        >
      | undefined,
  ): {
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
  } | null {
    if (!macrosPorDia || typeof macrosPorDia !== 'object') {
      return null;
    }
    const dias = Object.values(macrosPorDia);
    if (dias.length === 0) {
      return null;
    }
    const sum = dias.reduce(
      (acc, m) => ({
        calorias: acc.calorias + (m.calorias ?? 0),
        proteinas: acc.proteinas + (m.proteinas ?? 0),
        carbohidratos: acc.carbohidratos + (m.carbohidratos ?? 0),
        grasas: acc.grasas + (m.grasas ?? 0),
      }),
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
    );
    return {
      calorias: Math.round(sum.calorias / dias.length),
      proteinas: Math.round(sum.proteinas / dias.length),
      carbohidratos: Math.round(sum.carbohidratos / dias.length),
      grasas: Math.round(sum.grasas / dias.length),
    };
  }
}
