import { Inject, Injectable } from '@nestjs/common';

import { GeneracionPlanIaEntity } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import {
  GENERACION_PLAN_IA_REPOSITORY,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

import { EjecutarGeneracionPlanSemanalBackgroundService } from './ejecutar-generacion-plan-semanal-background.service';
import type { SolicitudPlanSemanal } from './generar-plan-semanal.use-case';
import {
  ERROR_GENERACION_PLAN_IA_VENCIDA,
  MENSAJE_GENERACION_PLAN_IA_VENCIDA,
  obtenerFechaCorteGeneracionPlanIaVencida,
} from '../constants/generacion-plan-ia.constants';

export interface IniciarGeneracionPlanSemanalInput extends SolicitudPlanSemanal {
  planAlimentacionId?: number | null;
}

@Injectable()
export class IniciarGeneracionPlanSemanalUseCase {
  constructor(
    @Inject(GENERACION_PLAN_IA_REPOSITORY)
    private readonly generacionRepo: GeneracionPlanIaRepository,
    private readonly ejecutor: EjecutarGeneracionPlanSemanalBackgroundService,
  ) {}

  async execute(
    input: IniciarGeneracionPlanSemanalInput,
  ): Promise<GeneracionPlanIaEntity> {
    const busquedaActiva = {
      socioId: input.socioId,
      gimnasioId: input.gimnasioId,
      planAlimentacionId: input.planAlimentacionId ?? null,
    };

    await this.generacionRepo.expirarActivasVencidas({
      ...busquedaActiva,
      fechaCorte: obtenerFechaCorteGeneracionPlanIaVencida(),
      mensajeEstado: MENSAJE_GENERACION_PLAN_IA_VENCIDA,
      errorMensaje: ERROR_GENERACION_PLAN_IA_VENCIDA,
      finalizadoEn: new Date(),
    });

    const activa = await this.generacionRepo.obtenerActiva({
      ...busquedaActiva,
    });

    if (activa) {
      throw new ConflictError(
        'Ya hay una generación de plan con IA en curso para este socio.',
        {
          generacionId: activa.id,
          estado: activa.estado,
        },
      );
    }

    const solicitud: SolicitudPlanSemanal = {
      socioId: input.socioId,
      nutricionistaId: input.nutricionistaId,
      gimnasioId: input.gimnasioId,
      diasAGenerar: input.diasAGenerar,
      comidasPorDia: input.comidasPorDia,
      alternativasPorComida: input.alternativasPorComida,
      notasGeneracion: input.notasGeneracion,
      fechaInicio: input.fechaInicio,
      caloriasLimite: input.caloriasLimite,
      proteinasEstimadas: input.proteinasEstimadas,
      carbohidratosEstimados: input.carbohidratosEstimados,
      grasasEstimados: input.grasasEstimados,
      alimentosPreferidos: input.alimentosPreferidos,
      alimentosEvitados: input.alimentosEvitados,
    };

    const generacion = await this.generacionRepo.crear({
      socioId: input.socioId,
      nutricionistaId: input.nutricionistaId,
      gimnasioId: input.gimnasioId,
      planAlimentacionId: input.planAlimentacionId ?? null,
      solicitudJson: solicitud,
      mensajeEstado: 'Generación en cola',
    });

    setTimeout(() => {
      void this.ejecutor.ejecutar(generacion.id);
    }, 0);

    return generacion;
  }
}
