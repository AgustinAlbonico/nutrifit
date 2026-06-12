import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class AvisoLlegadaTardeUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    turnoId: number,
    minutosTarde: number,
    socioId: number,
  ): Promise<void> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        socio: { idPersona: socioId, gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new BadRequestError('Turno no encontrado o no pertenece al socio');
    }

    if (turno.estadoTurno !== EstadoTurno.PROGRAMADO) {
      throw new BadRequestError('Solo se puede avisar llegada tarde para turnos programados');
    }

    if (turno.nutricionista?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.nutricionista.idPersona,
        tipo: TipoNotificacion.TURNO_AVISO_LLEGADA_TARDE,
        titulo: 'Aviso de llegada tarde',
        mensaje: `El socio ${turno.socio?.nombre} ${turno.socio?.apellido} avisó que llegará aprox. ${minutosTarde} min. tarde al turno de las ${turno.horaTurno}.`,
        metadata: { turnoId: turno.idTurno, minutosTarde },
      });
    }
  }
}
