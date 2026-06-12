import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

@Injectable()
export class NotificarSocioInasistenciaUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly tenantContext: TenantContextService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async execute(turnoId: number): Promise<void> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        nutricionista: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { socio: true },
    });

    if (!turno) {
      throw new BadRequestError('Turno no encontrado');
    }

    if (turno.estadoTurno !== EstadoTurno.AUSENTE) {
      throw new BadRequestError('El turno debe estar en estado AUSENTE para notificar');
    }

    if (turno.socio?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.socio.idPersona,
        tipo: TipoNotificacion.TURNO_INASISTENCIA_AVISO,
        titulo: 'Inasistencia a turno',
        mensaje: `Hola ${turno.socio.nombre}, no te presentaste al turno de las ${turno.horaTurno}. Por favor, contactanos para reagendar.`,
        metadata: { turnoId: turno.idTurno },
      });
    }
  }
}
