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

@Injectable()
export class AusenciaTurnoScheduler {
  private readonly logger = new Logger(AusenciaTurnoScheduler.name);

  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(POLITICA_OPERATIVA_REPOSITORY)
    private readonly politicaRepository: IPoliticaOperativaRepository,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  @Cron('*/5 * * * *')
  async marcarAusentesAutomaticos(): Promise<void> {
    this.logger.log('Ejecutando verificación de turnos ausentes...');

    const ahora = new Date();
    const fechaHoy = ahora.toISOString().split('T')[0];

    const turnos = await this.turnoRepository
      .createQueryBuilder('turno')
      .where('turno.fechaTurno = :fecha', { fecha: fechaHoy })
      .andWhere('turno.estadoTurno IN (:...estados)', {
        estados: [EstadoTurno.PROGRAMADO],
      })
      .getMany();

    for (const turno of turnos) {
      const gimnasioId = turno.gimnasio?.idGimnasio ?? 1;
      const umbralMinutos =
        await this.politicaRepository.getUmbralAusente(gimnasioId);

      const [hora, minuto] = turno.horaTurno.split(':').map(Number);
      const turnoTime = new Date(ahora);
      turnoTime.setHours(hora, minuto + umbralMinutos, 0, 0);

      if (ahora > turnoTime) {
        turno.estadoTurno = EstadoTurno.AUSENTE;
        turno.ausenteAt = ahora;
        await this.turnoRepository.save(turno);
        this.logger.log(`Turno ${turno.idTurno} marcado como AUSENTE`);

        // Notificaciones
        try {
          if (turno.socio?.idPersona) {
            await this.notificacionesService.crear({
              destinatarioId: turno.socio.idPersona,
              tipo: TipoNotificacion.TURNO_AUSENTE_AUTO,
              titulo: 'Turno ausente',
              mensaje: `Tu turno del ${turno.fechaTurno} a las ${turno.horaTurno} fue marcado como ausente porque no te presentaste.`,
              metadata: { turnoId: turno.idTurno },
            });
          }
          if (turno.nutricionista?.idPersona) {
            await this.notificacionesService.crear({
              destinatarioId: turno.nutricionista.idPersona,
              tipo: TipoNotificacion.TURNO_AUSENTE_AUTO,
              titulo: 'Socio ausente',
              mensaje: `El socio ${turno.socio?.nombre} ${turno.socio?.apellido} no se presentó al turno #${turno.idTurno}.`,
              metadata: { turnoId: turno.idTurno },
            });
          }
        } catch (error) {
          this.logger.error(`Error al notificar ausencias del turno ${turno.idTurno}`, error);
        }
      }
    }
  }
}
