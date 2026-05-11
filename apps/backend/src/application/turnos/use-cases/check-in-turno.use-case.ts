import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

@Injectable()
export class CheckInTurnoUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async execute(
    turnoId: number,
  ): Promise<{ success: boolean; estado: EstadoTurno }> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: { socio: true },
    });

    if (!turno) {
      throw new BadRequestError('Turno no encontrado');
    }

    if (turno.estadoTurno !== EstadoTurno.PROGRAMADO) {
      throw new BadRequestError(
        `No se puede hacer check-in en un turno con estado ${turno.estadoTurno}`,
      );
    }

    turno.estadoTurno = EstadoTurno.PRESENTE;
    turno.checkInAt = new Date();

    await this.turnoRepository.save(turno);

    if (turno.socio?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.socio.idPersona,
        tipo: TipoNotificacion.CHECK_IN,
        titulo: 'Check-in registrado',
        mensaje: `Se registró tu check-in del turno #${turno.idTurno}.`,
        metadata: { turnoId: turno.idTurno },
      });
    }

    if (turno.nutricionista?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.nutricionista.idPersona,
        tipo: TipoNotificacion.CHECK_IN,
        titulo: 'Socio realizó check-in',
        mensaje: `El socio hizo check-in para el turno #${turno.idTurno}.`,
        metadata: { turnoId: turno.idTurno },
      });
    }

    return { success: true, estado: EstadoTurno.PRESENTE };
  }
}
