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
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import {
  combineArgentinaDateAndTime,
  formatArgentinaDate,
  getArgentinaNow,
  getArgentinaTodayDate,
} from 'src/common/utils/argentina-datetime.util';
import {
  AccionAuditoria,
  TipoAccionAuditoria,
} from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

@Injectable()
export class AusenciaTurnoScheduler {
  private readonly logger = new Logger(AusenciaTurnoScheduler.name);

  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(POLITICA_OPERATIVA_REPOSITORY)
    private readonly politicaRepository: IPoliticaOperativaRepository,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Cron('*/5 * * * *')
  async marcarAusentesAutomaticos(): Promise<void> {
    this.logger.log('Ejecutando verificación de turnos ausentes...');

    const ahora = getArgentinaNow();
    const fechaHoyArgentina = getArgentinaTodayDate(ahora);

    const turnos = await this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.socio', 'socio')
      .leftJoinAndSelect('turno.nutricionista', 'nutricionista')
      .leftJoinAndSelect('turno.gimnasio', 'gimnasio')
      .leftJoinAndSelect('socio.usuario', 'socioUsuario')
      .leftJoinAndSelect('nutricionista.usuario', 'nutriUsuario')
      .where('turno.fechaTurno = :fecha', { fecha: fechaHoyArgentina })
      .andWhere('turno.estadoTurno IN (:...estados)', {
        estados: [EstadoTurno.CONFIRMADO],
      })
      .getMany();

    for (const turno of turnos) {
      const gimnasioId = turno.gimnasio?.idGimnasio ?? 1;
      const umbralMinutos =
        await this.politicaRepository.getUmbralAusente(gimnasioId);

      const turnoDateTime = combineArgentinaDateAndTime(
        turno.fechaTurno,
        turno.horaTurno,
      );
      const umbralMs = umbralMinutos * 60 * 1000;

      if (ahora.getTime() > turnoDateTime.getTime() + umbralMs) {
        const valoresAntes = {
          estadoTurno: turno.estadoTurno,
          ausenteAt: turno.ausenteAt,
        };

        turno.estadoTurno = EstadoTurno.AUSENTE;
        turno.ausenteAt = ahora;
        await this.turnoRepository.save(turno);
        await this.auditoriaService.registrar({
          gimnasioId,
          usuarioId: 'system',
          modulo: 'turnos',
          entidad: 'Turno',
          entidadId: turno.idTurno,
          accion: AccionAuditoria.UPDATE,
          tipoAccion: TipoAccionAuditoria.AUSENCIA_AUTO,
          descripcion: 'Marcado automatico de ausencia por scheduler',
          valoresAntes,
          valoresDespues: {
            estadoTurno: turno.estadoTurno,
            ausenteAt: turno.ausenteAt,
          },
        });
        this.logger.log(`Turno ${turno.idTurno} marcado como AUSENTE`);

        // Notificaciones
        try {
          if (turno.socio?.usuario?.idUsuario != null) {
            await this.notificacionesService.crear({
              destinatarioId: turno.socio.usuario.idUsuario,
              tipo: TipoNotificacion.TURNO_AUSENTE_AUTO,
              titulo: 'Turno ausente',
              mensaje: `Tu turno del ${formatArgentinaDate(turno.fechaTurno)} a las ${turno.horaTurno} fue marcado como ausente porque no te presentaste.`,
              metadata: { turnoId: turno.idTurno },
            });
          }
          if (turno.nutricionista?.usuario?.idUsuario != null) {
            await this.notificacionesService.crear({
              destinatarioId: turno.nutricionista.usuario.idUsuario,
              tipo: TipoNotificacion.TURNO_AUSENTE_AUTO,
              titulo: 'Socio ausente',
              mensaje: `El socio ${turno.socio?.nombre} ${turno.socio?.apellido} no se presentó al turno #${turno.idTurno}.`,
              metadata: { turnoId: turno.idTurno },
            });
          }
        } catch (error) {
          this.logger.error(
            `Error al notificar ausencias del turno ${turno.idTurno}`,
            error,
          );
        }
      }
    }
  }
}
