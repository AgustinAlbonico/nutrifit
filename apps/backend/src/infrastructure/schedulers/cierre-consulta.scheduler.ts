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
import {
  AccionAuditoria,
  TipoAccionAuditoria,
} from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

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
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Cron('*/5 * * * *')
  async ejecutarCierreAutomatico(): Promise<void> {
    this.logger.log('Ejecutando verificación de cierre automático de consultas...');

    const ahora = new Date();

    const turnos = await this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.nutricionista', 'nutricionista')
      .leftJoinAndSelect('nutricionista.usuario', 'nutriUsuario')
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
          const valoresAntes = {
            preavisoCierreAutoEnviadoEn: turno.preavisoCierreAutoEnviadoEn,
          };

          turno.preavisoCierreAutoEnviadoEn = ahora;
          await this.turnoRepository.save(turno);
          await this.auditoriaService.registrar({
            gimnasioId,
            usuarioId: 'system',
            modulo: 'turnos',
            entidad: 'Turno',
            entidadId: turno.idTurno,
            accion: AccionAuditoria.UPDATE,
            tipoAccion: TipoAccionAuditoria.CIERRE_AUTO,
            descripcion: 'Preaviso automatico de cierre de consulta',
            valoresAntes,
            valoresDespues: {
              preavisoCierreAutoEnviadoEn: turno.preavisoCierreAutoEnviadoEn,
            },
          });

          if (turno.nutricionista?.usuario?.idUsuario != null) {
            await this.notificacionesService.crear({
              destinatarioId: turno.nutricionista.usuario.idUsuario,
              tipo: TipoNotificacion.CONSULTA_PREAVISO_CIERRE_AUTO,
              titulo: 'Cierre automático próximo',
              mensaje: `La consulta #${turno.idTurno} se cerrará automáticamente en ${preavisoMin} min. Finalizala para cargar los datos clínicos.`,
              metadata: { turnoId: turno.idTurno, motivo: 'PREAVISO_CIERRE_AUTO' },
            });
          }
          this.logger.log(`Preaviso enviado para turno ${turno.idTurno}`);
        }

        if (minutosTranscurridos >= umbralMin) {
          const valoresAntes = {
            estadoTurno: turno.estadoTurno,
            consultaFinalizadaAt: turno.consultaFinalizadaAt,
            cierreAutomatico: turno.cierreAutomatico,
          };

          await this.finalizarPorInactividadUseCase.execute(turno.idTurno);
          await this.auditoriaService.registrar({
            gimnasioId,
            usuarioId: 'system',
            modulo: 'turnos',
            entidad: 'Turno',
            entidadId: turno.idTurno,
            accion: AccionAuditoria.UPDATE,
            tipoAccion: TipoAccionAuditoria.CIERRE_AUTO,
            descripcion: 'Cierre automatico de consulta por inactividad',
            valoresAntes,
            valoresDespues: {
              estadoTurno: EstadoTurno.REALIZADO,
              cierreAutomatico: true,
            },
          });
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
