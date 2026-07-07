import { Inject, Injectable } from '@nestjs/common';

import { GeneracionPlanIaEntity } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  GENERACION_PLAN_IA_REPOSITORY,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

import {
  ERROR_GENERACION_PLAN_IA_CANCELADA,
  MENSAJE_GENERACION_PLAN_IA_CANCELADA,
} from '../constants/generacion-plan-ia.constants';

export interface CancelarGeneracionPlanSemanalInput {
  generacionId: number;
  gimnasioId: number;
}

@Injectable()
export class CancelarGeneracionPlanSemanalUseCase {
  constructor(
    @Inject(GENERACION_PLAN_IA_REPOSITORY)
    private readonly generacionRepo: GeneracionPlanIaRepository,
  ) {}

  async execute(
    input: CancelarGeneracionPlanSemanalInput,
  ): Promise<GeneracionPlanIaEntity> {
    const generacion = await this.obtenerGeneracionDelGimnasio(input);

    if (!generacion.estaActiva()) {
      return generacion;
    }

    const cancelada = await this.generacionRepo.actualizarSiActiva(
      generacion.id,
      {
        estado: 'CANCELADO',
        mensajeEstado: MENSAJE_GENERACION_PLAN_IA_CANCELADA,
        errorMensaje: ERROR_GENERACION_PLAN_IA_CANCELADA,
        finalizadoEn: new Date(),
      },
    );

    if (cancelada) {
      return cancelada;
    }

    return this.obtenerGeneracionDelGimnasio(input);
  }

  private async obtenerGeneracionDelGimnasio(
    input: CancelarGeneracionPlanSemanalInput,
  ): Promise<GeneracionPlanIaEntity> {
    const generacion = await this.generacionRepo.obtenerPorId(input.generacionId);

    if (!generacion || generacion.gimnasioId !== input.gimnasioId) {
      throw new NotFoundError('Generación IA', String(input.generacionId));
    }

    return generacion;
  }
}
