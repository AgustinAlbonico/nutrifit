import { Inject, Injectable } from '@nestjs/common';

import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import {
  GENERACION_PLAN_IA_REPOSITORY,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

export interface VerificarBloqueoGeneracionPlanIaInput {
  socioId: number;
  gimnasioId: number;
  planAlimentacionId?: number | null;
}

@Injectable()
export class BloqueoGeneracionPlanIaService {
  constructor(
    @Inject(GENERACION_PLAN_IA_REPOSITORY)
    private readonly generacionRepo: GeneracionPlanIaRepository,
  ) {}

  async verificarSinGeneracionActiva(
    input: VerificarBloqueoGeneracionPlanIaInput,
  ): Promise<void> {
    const activa = await this.generacionRepo.obtenerActiva({
      socioId: input.socioId,
      gimnasioId: input.gimnasioId,
      planAlimentacionId: input.planAlimentacionId ?? null,
    });

    if (!activa) {
      return;
    }

    throw new ConflictError(
      'El plan se está generando con IA. Esperá a que termine para editarlo.',
      {
        generacionId: activa.id,
        estado: activa.estado,
        mensajeEstado: activa.mensajeEstado,
      },
    );
  }
}
