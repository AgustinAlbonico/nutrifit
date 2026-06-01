import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';

@Injectable()
export class FinalizarConsultaUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
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

    if (turno.estadoTurno !== EstadoTurno.EN_CURSO) {
      throw new BadRequestError(
        `No se puede finalizar consulta en un turno con estado ${turno.estadoTurno}`,
      );
    }

    if (turno.consultaFinalizadaAt !== null) {
      throw new BadRequestError('La consulta ya fue finalizada');
    }

    turno.estadoTurno = EstadoTurno.REALIZADO;
    turno.consultaFinalizadaAt = new Date();

    await this.turnoRepository.save(turno);

    await this.auditoriaService.registrar({
      accion: AccionAuditoria.CONSULTA_FINALIZADA,
      entidad: 'Turno',
      entidadId: turnoId,
      metadata: {
        estadoAnterior: EstadoTurno.EN_CURSO,
        estadoNuevo: EstadoTurno.REALIZADO,
      },
    });

    if (turno.socio?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.socio.idPersona,
        tipo: TipoNotificacion.CONSULTA_FINALIZADA,
        titulo: 'Consulta finalizada',
        mensaje: `Se finalizó tu consulta del turno #${turno.idTurno}.`,
        metadata: { turnoId: turno.idTurno },
      });
    }

    return { success: true, estado: EstadoTurno.REALIZADO };
  }
}
