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
    // Filtra planes soft-deleted. El seed legacy o auto-creates antiguos pueden
    // haber dejado duplicados; el script `scripts/dedupe-planes.ts` los marca
    // con `eliminadoEn`. No los mostramos en la UI del nutricionista.
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

    return planes.map(mapPlanToResponse);
  }
}
