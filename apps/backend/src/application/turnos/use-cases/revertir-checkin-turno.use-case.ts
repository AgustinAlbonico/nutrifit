import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

export interface RevertirCheckinResult {
  success: boolean;
  estado: EstadoTurno;
}

@Injectable()
export class RevertirCheckinTurnoUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    turnoId: number,
    motivo: string,
    userId: number,
  ): Promise<RevertirCheckinResult> {
    const motivoLimpio = motivo?.trim();
    if (!motivoLimpio) {
      throw new BadRequestError('El motivo de la reversión es obligatorio.');
    }

    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        nutricionista: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    if (turno.estadoTurno !== EstadoTurno.PRESENTE) {
      throw new ConflictError(
        `Solo se puede revertir el check-in de un turno en estado PRESENTE. Estado actual: ${turno.estadoTurno}`,
      );
    }

    const antes = {
      estado: turno.estadoTurno,
      checkInAt: turno.checkInAt?.toISOString() ?? null,
      llegadaTardeMin: turno.llegadaTardeMin,
    };

    turno.estadoTurno = EstadoTurno.CONFIRMADO;
    turno.checkInAt = null;
    turno.llegadaTardeMin = null;

    const turnoActualizado = await this.turnoRepository.save(turno);

    await this.auditoriaService.registrar({
      usuarioId: userId,
      accion: AccionAuditoria.REVERT_CHECKIN,
      entidad: 'turno',
      entidadId: turnoActualizado.idTurno,
      metadata: {
        motivo: motivoLimpio,
        antes,
        despues: {
          estado: turnoActualizado.estadoTurno,
          checkInAt: null,
          llegadaTardeMin: null,
        },
      },
      gimnasioId: this.tenantContext.gimnasioId,
    });

    this.logger.log(
      `Check-in revertido para turno ${turnoActualizado.idTurno} por usuario ${userId}. Motivo: ${motivoLimpio}`,
    );

    return {
      success: true,
      estado: EstadoTurno.CONFIRMADO,
    };
  }
}
