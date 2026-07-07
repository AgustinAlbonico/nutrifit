import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  ERROR_GENERACION_PLAN_IA_VENCIDA,
  MENSAJE_GENERACION_PLAN_IA_VENCIDA,
  obtenerFechaCorteGeneracionPlanIaVencida,
} from 'src/application/ai/constants/generacion-plan-ia.constants';
import {
  GENERACION_PLAN_IA_REPOSITORY,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

@Injectable()
export class GeneracionPlanIaReaperScheduler {
  private readonly logger = new Logger(GeneracionPlanIaReaperScheduler.name);

  constructor(
    @Inject(GENERACION_PLAN_IA_REPOSITORY)
    private readonly generacionRepo: GeneracionPlanIaRepository,
  ) {}

  @Cron('*/5 * * * *')
  async expirarGeneracionesVencidas(): Promise<void> {
    try {
      const cantidad = await this.generacionRepo.expirarActivasVencidasGlobal({
        fechaCorte: obtenerFechaCorteGeneracionPlanIaVencida(),
        mensajeEstado: MENSAJE_GENERACION_PLAN_IA_VENCIDA,
        errorMensaje: ERROR_GENERACION_PLAN_IA_VENCIDA,
        finalizadoEn: new Date(),
      });

      if (cantidad > 0) {
        this.logger.warn(
          `Se marcaron ${cantidad} generaciones IA vencidas como ERROR`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Error expirando generaciones IA vencidas',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
