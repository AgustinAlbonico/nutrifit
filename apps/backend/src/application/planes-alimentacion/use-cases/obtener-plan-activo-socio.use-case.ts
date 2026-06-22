import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { PlanAlimentacionResponseDto } from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class ObtenerPlanActivoSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(socioId: number): Promise<PlanAlimentacionResponseDto | null> {
    const socio = await this.socioRepo.findOne({
      where: { idPersona: socioId, gimnasioId: this.tenantContext.gimnasioId },
    });
    if (!socio) {
      throw new NotFoundError('Socio', String(socioId));
    }

    const plan = await this.planRepo.findOne({
      where: {
        socio: {
          idPersona: socioId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        activo: true,
      },
      relations: {
        dias: { opcionesComida: { items: { alimento: true } } },
        socio: true,
        nutricionista: true,
      },
    });

    if (!plan) {
      return null;
    }

    return mapPlanToResponse(plan);
  }
}
