import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { PlanAlimentacionResponseDto } from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class ListarPlanesNutricionistaUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    nutricionistaId: number,
  ): Promise<PlanAlimentacionResponseDto[]> {
    const planes = await this.planRepo.find({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        eliminadoEn: IsNull(),
      },
      relations: {
        socio: true,
        nutricionista: true,
        dias: { opcionesComida: { items: { alimento: true } } },
      },
      order: { fechaCreacion: 'DESC' },
    });

    const mejorPlanPorSocio = new Map<number, PlanAlimentacionOrmEntity>();

    for (const plan of planes) {
      const socioId = (plan.socio as { idPersona: number }).idPersona;
      const existente = mejorPlanPorSocio.get(socioId);

      if (!existente) {
        mejorPlanPorSocio.set(socioId, plan);
        continue;
      }

      const planGanaPorSerActivo = plan.activo && !existente.activo;
      const mismoEstadoPeroMasNuevo =
        plan.activo === existente.activo &&
        plan.fechaCreacion > existente.fechaCreacion;

      if (planGanaPorSerActivo || mismoEstadoPeroMasNuevo) {
        mejorPlanPorSocio.set(socioId, plan);
      }
    }

    return Array.from(mejorPlanPorSocio.values()).map(mapPlanToResponse);
  }
}
