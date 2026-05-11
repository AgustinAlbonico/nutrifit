import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos/turno-operacion-response.dto';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  formatArgentinaDate,
  normalizeTimeToHHmm,
} from 'src/common/utils/argentina-datetime.util';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';

@Injectable()
export class DesbloquearTurnoUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    turnoId: number,
  ): Promise<TurnoOperacionResponseDto> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: { nutricionista: true, socio: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    if (turno.nutricionista.idPersona !== nutricionistaId) {
      throw new ForbiddenError('No tiene permisos para gestionar este turno.');
    }

    if (turno.estadoTurno !== EstadoTurno.PROGRAMADO || turno.socio !== null) {
      throw new BadRequestError(
        'Solo se pueden desbloquear turnos bloqueados (PROGRAMADO sin socio).',
      );
    }

    turno.estadoTurno = EstadoTurno.CANCELADO;
    const updatedTurno = await this.turnoRepository.save(turno);

    this.logger.log(
      `Turno ${turnoId} desbloqueado por profesional ${nutricionistaId}.`,
    );

    return this.toResponseDto(updatedTurno);
  }

  private toResponseDto(turno: TurnoOrmEntity): TurnoOperacionResponseDto {
    const response = new TurnoOperacionResponseDto();
    response.idTurno = turno.idTurno;
    response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
    response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
    response.estadoTurno = turno.estadoTurno;
    response.socioId = turno.socio?.idPersona ?? 0;
    response.nutricionistaId = turno.nutricionista?.idPersona ?? 0;
    return response;
  }
}
