import { Inject, Injectable } from '@nestjs/common';

import type { GeneracionPlanIaEntity } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';
import {
  GENERACION_PLAN_IA_REPOSITORY,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

export interface ObtenerGeneracionPlanActivaInput {
  socioId: number;
  gimnasioId: number;
  planAlimentacionId?: number | null;
}

@Injectable()
export class ObtenerGeneracionPlanActivaUseCase {
  constructor(
    @Inject(GENERACION_PLAN_IA_REPOSITORY)
    private readonly generacionRepo: GeneracionPlanIaRepository,
  ) {}

  async execute(
    input: ObtenerGeneracionPlanActivaInput,
  ): Promise<GeneracionPlanIaEntity | null> {
    return this.generacionRepo.obtenerActiva(input);
  }
}
