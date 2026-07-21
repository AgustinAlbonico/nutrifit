import { Inject, Injectable } from '@nestjs/common';

import { GeneracionPlanIaEntity } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  GENERACION_PLAN_IA_REPOSITORY,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

export interface ObtenerGeneracionPlanSemanalInput {
  generacionId: number;
  gimnasioId: number;
}

@Injectable()
export class ObtenerGeneracionPlanSemanalUseCase {
  constructor(
    @Inject(GENERACION_PLAN_IA_REPOSITORY)
    private readonly generacionRepo: GeneracionPlanIaRepository,
  ) {}

  async execute(
    input: ObtenerGeneracionPlanSemanalInput,
  ): Promise<GeneracionPlanIaEntity> {
    const generacion = await this.generacionRepo.obtenerPorId(
      input.generacionId,
    );

    if (!generacion || generacion.gimnasioId !== input.gimnasioId) {
      throw new NotFoundError('Generación IA', String(input.generacionId));
    }

    return generacion;
  }
}
