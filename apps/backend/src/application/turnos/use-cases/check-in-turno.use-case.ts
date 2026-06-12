import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  combineArgentinaDateAndTime,
  getArgentinaNow,
} from 'src/common/utils/argentina-datetime.util';

@Injectable()
export class CheckInTurnoUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    turnoId: number,
  ): Promise<{ success: boolean; estado: EstadoTurno }> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        socio: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new BadRequestError('Turno no encontrado');
    }

    if (turno.estadoTurno !== EstadoTurno.PROGRAMADO) {
      throw new BadRequestError(
        `No se puede hacer check-in en un turno con estado ${turno.estadoTurno}`,
      );
    }

    const ahora = getArgentinaNow();
    const horaTurnoReal = combineArgentinaDateAndTime(
      turno.fechaTurno,
      turno.horaTurno,
    );
    const diffMs = ahora.getTime() - horaTurnoReal.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);

    if (diffMinutos < -10 || diffMinutos > 30) {
      throw new BadRequestError(
        'El check-in solo se permite entre 10 min antes y 30 min después del horario del turno.',
      );
    }

    turno.estadoTurno = EstadoTurno.PRESENTE;
    turno.checkInAt = ahora;
    
    if (diffMinutos > 0) {
      turno.llegadaTardeMin = diffMinutos;
    }

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
