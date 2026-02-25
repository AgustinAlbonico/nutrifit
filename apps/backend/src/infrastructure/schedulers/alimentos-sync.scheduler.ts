import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AlimentosSyncService } from '../alimentos/alimentos-sync.service';

@Injectable()
export class AlimentosSyncScheduler {
  private readonly logger = new Logger(AlimentosSyncScheduler.name);

  constructor(private readonly alimentosSyncService: AlimentosSyncService) {}

  @Cron('30 3 * * *')
  async ejecutarSincronizacionNocturna(): Promise<void> {
    if (!this.alimentosSyncService.sincronizacionAutomaticaHabilitada()) {
      return;
    }

    this.logger.log('Iniciando sincronizacion automatica de alimentos...');

    try {
      const resultado =
        await this.alimentosSyncService.sincronizarCatalogo('cron');
      this.logger.log(
        `Sincronizacion automatica OK. Insertados=${resultado.insertados}, ` +
          `eliminados=${resultado.eliminadosPorCuracion}, ` +
          `paginas=${resultado.paginasConsultadas}.`,
      );
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error en sincronizacion automatica de alimentos: ${detalle}`,
      );
    }
  }
}
