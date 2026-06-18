import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { MotivoCierreAutomatico } from 'src/domain/entities/Turno/motivo-cierre-automatico.enum';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

@Injectable()
export class FinalizarConsultaPorInactividadUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async execute(turnoId: number): Promise<{ success: boolean; estado: EstadoTurno }> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    if (turno.estadoTurno !== EstadoTurno.EN_CURSO) {
      throw new BadRequestError(
        `No se puede cerrar por inactividad: el turno debe estar EN_CURSO, actual: ${turno.estadoTurno}`,
      );
    }

    turno.estadoTurno = EstadoTurno.REALIZADO;
    turno.consultaFinalizadaAt = new Date();
    turno.cierreAutomatico = true;
    turno.motivoCierreAutomatico = MotivoCierreAutomatico.INACTIVIDAD;
    turno.cierreAutomaticoEn = new Date();

    await this.turnoRepository.save(turno);

    if (turno.nutricionista?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.nutricionista.idPersona,
        tipo: TipoNotificacion.CONSULTA_CERRADA_AUTO,
        titulo: 'Consulta cerrada automáticamente',
        mensaje: `La consulta #${turno.idTurno} fue cerrada automáticamente por inactividad. Si necesitás editarla, reabrirla desde la pantalla de consulta.`,
        metadata: { turnoId: turno.idTurno, motivo: 'CIERRE_AUTO_INACTIVIDAD' },
      });
    }

    return { success: true, estado: EstadoTurno.REALIZADO };
  }
}
