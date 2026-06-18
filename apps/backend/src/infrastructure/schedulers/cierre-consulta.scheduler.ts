import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  POLITICA_OPERATIVA_REPOSITORY,
  IPoliticaOperativaRepository,
} from 'src/application/politicas/politica-operativa.repository';
import { FinalizarConsultaPorInactividadUseCase } from 'src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

@Injectable()
export class CierreConsultaScheduler {
  private readonly logger = new Logger(CierreConsultaScheduler.name);

  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(POLITICA_OPERATIVA_REPOSITORY)
    private readonly politicaRepository: IPoliticaOperativaRepository,
    private readonly finalizarPorInactividadUseCase: FinalizarConsultaPorInactividadUseCase,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  @Cron('*/5 * * * *')
  async ejecutarCierreAutomatico(): Promise<void> {
    this.logger.log('Ejecutando verificación de cierre automático de consultas...');

    const ahora = new Date();

    const turnos = await this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.nutricionista', 'nutricionista')
      .leftJoinAndSelect('turno.gimnasio', 'gimnasio')
      .where('turno.estadoTurno = :estado', { estado: EstadoTurno.EN_CURSO })
      .andWhere('turno.consultaIniciadaAt IS NOT NULL')
      .getMany();

    for (const turno of turnos) {
      try {
        const gimnasioId = turno.gimnasio?.idGimnasio ?? 1;
        const umbralMin = await this.politicaRepository.getUmbralCierreConsultaMin(gimnasioId);
        const preavisoMin = await this.politicaRepository.getPreavisoCierreConsultaMin(gimnasioId);
        const minutosTranscurridos = (ahora.getTime() - turno.consultaIniciadaAt!.getTime()) / 60_000;

        if (
          minutosTranscurridos >= (umbralMin - preavisoMin) &&
          minutosTranscurridos < umbralMin &&
          !turno.preavisoCierreAutoEnviadoEn
        ) {
          turno.preavisoCierreAutoEnviadoEn = ahora;
          await this.turnoRepository.save(turno);

          if (turno.nutricionista?.idPersona) {
            await this.notificacionesService.crear({
              destinatarioId: turno.nutricionista.idPersona,
              tipo: TipoNotificacion.CONSULTA_PREAVISO_CIERRE_AUTO,
              titulo: 'Cierre automático próximo',
              mensaje: `La consulta #${turno.idTurno} se cerrará automáticamente en ${preavisoMin} min. Finalizala para cargar los datos clínicos.`,
              metadata: { turnoId: turno.idTurno, motivo: 'PREAVISO_CIERRE_AUTO' },
            });
          }
          this.logger.log(`Preaviso enviado para turno ${turno.idTurno}`);
        }

        if (minutosTranscurridos >= umbralMin) {
          await this.finalizarPorInactividadUseCase.execute(turno.idTurno);
          this.logger.log(`Turno ${turno.idTurno} cerrado automáticamente por inactividad`);
        }
      } catch (error) {
        this.logger.error(
          `Error procesando cierre automático del turno ${turno.idTurno}`,
          error as Error,
        );
      }
    }
  }
}
