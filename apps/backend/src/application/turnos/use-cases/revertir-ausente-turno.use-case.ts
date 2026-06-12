import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import {
  combineArgentinaDateAndTime,
  getArgentinaNow,
} from 'src/common/utils/argentina-datetime.util';

@Injectable()
export class RevertirAusenteTurnoUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly tenantContext: TenantContextService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(
    turnoId: number,
    motivoReversion: string | undefined,
    userId: number,
    llegadaTardeMin?: number,
  ): Promise<{ estadoFinal: EstadoTurno; hizoCheckIn: boolean }> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        nutricionista: { gimnasioId: this.tenantContext.gimnasioId },
      },
    });

    if (!turno) {
      throw new BadRequestError('Turno no encontrado');
    }

    if (turno.estadoTurno !== EstadoTurno.AUSENTE) {
      throw new BadRequestError(
        'Solo se pueden revertir turnos que estén en estado AUSENTE',
      );
    }

    turno.ausenteAt = null;
    turno.ausenteMotivo = null;

    let hizoCheckIn = false;
    let ventanaNota = '';

    if (typeof llegadaTardeMin === 'number' && llegadaTardeMin > 0) {
      // El recep quiere revertir Y registrar check-in directo con迟到.
      // Validamos la ventana del check-in respecto al horario del turno
      // (mismo criterio que check-in-turno: -10min a +30min).
      const ahora = getArgentinaNow();
      const horaTurnoReal = combineArgentinaDateAndTime(
        turno.fechaTurno,
        turno.horaTurno,
      );
      const diffMs = ahora.getTime() - horaTurnoReal.getTime();
      const diffMinutos = Math.floor(diffMs / 60000);

      if (diffMinutos < -10 || diffMinutos > 30) {
        throw new BadRequestError(
          'El check-in con llegada tarde solo se permite entre 10 min antes y 30 min después del horario del turno.',
        );
      }

      turno.estadoTurno = EstadoTurno.PRESENTE;
      turno.checkInAt = ahora;
      turno.llegadaTardeMin = llegadaTardeMin;
      hizoCheckIn = true;
      ventanaNota = ` + check-in directo (${llegadaTardeMin} min tarde)`;
    } else {
      turno.estadoTurno = EstadoTurno.PROGRAMADO;
    }

    await this.turnoRepository.save(turno);

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: AccionAuditoria.REVERT_ABSENT,
      entidad: 'Turno',
      entidadId: turno.idTurno,
      metadata: {
        motivoReversion: motivoReversion || 'Sin motivo',
        conCheckIn: hizoCheckIn,
        llegadaTardeMin: hizoCheckIn ? llegadaTardeMin : null,
      },
      gimnasioId: this.tenantContext.gimnasioId,
    });

    return {
      estadoFinal: turno.estadoTurno,
      hizoCheckIn,
    };
  }
}
