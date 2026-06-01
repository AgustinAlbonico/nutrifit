import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { RegistrarAsistenciaTurnoDto } from 'src/application/turnos/dtos/registrar-asistencia-turno.dto';
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
  combineArgentinaDateAndTime,
  formatArgentinaDate,
  normalizeTimeToHHmm,
} from 'src/common/utils/argentina-datetime.util';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';

@Injectable()
export class RegistrarAsistenciaTurnoUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    turnoId: number,
    payload: RegistrarAsistenciaTurnoDto,
  ): Promise<TurnoOperacionResponseDto> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: {
        nutricionista: true,
        socio: true,
      },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    if (turno.nutricionista.idPersona !== nutricionistaId) {
      throw new ForbiddenError(
        'No tiene permisos para registrar asistencia en este turno.',
      );
    }

    if (turno.estadoTurno !== EstadoTurno.PRESENTE) {
      throw new BadRequestError(
        'Solo se puede registrar asistencia en turnos en estado PRESENTE.',
      );
    }

    if (!this.hasTurnoElapsed(turno)) {
      throw new BadRequestError(
        'Solo se puede registrar asistencia despues de la hora del turno.',
      );
    }

    turno.estadoTurno = payload.asistio
      ? EstadoTurno.REALIZADO
      : EstadoTurno.AUSENTE;

    const turnoActualizado = await this.turnoRepository.save(turno);

    this.logger.log(
      `Asistencia registrada para turno ${turnoId}. Nuevo estado=${turnoActualizado.estadoTurno}.`,
    );

    return this.toResponseDto(turnoActualizado);
  }

  private hasTurnoElapsed(turno: TurnoOrmEntity): boolean {
    const scheduledDate = combineArgentinaDateAndTime(
      turno.fechaTurno,
      turno.horaTurno,
    );

    return new Date().getTime() >= scheduledDate.getTime();
  }

  private toResponseDto(turno: TurnoOrmEntity): TurnoOperacionResponseDto {
    const response = new TurnoOperacionResponseDto();
    response.idTurno = turno.idTurno;
    response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
    response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
    response.estadoTurno = turno.estadoTurno;
    response.socioId = turno.socio.idPersona ?? 0;
    response.nutricionistaId = turno.nutricionista.idPersona ?? 0;
    return response;
  }
}
