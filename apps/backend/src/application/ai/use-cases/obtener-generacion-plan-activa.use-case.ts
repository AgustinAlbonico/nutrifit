import { Inject, Injectable } from '@nestjs/common';

import type { GeneracionPlanIaEntity } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';
import {
  GENERACION_PLAN_IA_REPOSITORY,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

import {
  ERROR_GENERACION_PLAN_IA_VENCIDA,
  MENSAJE_GENERACION_PLAN_IA_VENCIDA,
  obtenerFechaCorteGeneracionPlanIaVencida,
} from '../constants/generacion-plan-ia.constants';

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
    await this.generacionRepo.expirarActivasVencidas({
      socioId: input.socioId,
      gimnasioId: input.gimnasioId,
      planAlimentacionId: input.planAlimentacionId ?? null,
      fechaCorte: obtenerFechaCorteGeneracionPlanIaVencida(),
      mensajeEstado: MENSAJE_GENERACION_PLAN_IA_VENCIDA,
      errorMensaje: ERROR_GENERACION_PLAN_IA_VENCIDA,
      finalizadoEn: new Date(),
    });

    return this.generacionRepo.obtenerActiva(input);
  }
}
