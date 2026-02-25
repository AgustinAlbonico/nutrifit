import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos';
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
import {
  SocioOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';

@Injectable()
export class CancelarTurnoSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    userId: number,
    turnoId: number,
  ): Promise<TurnoOperacionResponseDto> {
    const socio = await this.resolveSocioByUserId(userId);

    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: {
        socio: true,
        nutricionista: true,
      },
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    if (turno.socio.idPersona !== socio.idPersona) {
      throw new ForbiddenError('No tiene permisos para cancelar este turno.');
    }

    if (turno.estadoTurno !== EstadoTurno.PENDIENTE) {
      throw new BadRequestError(
        'Solo se pueden cancelar turnos en estado PENDIENTE.',
      );
    }

    this.validate24hRule(turno.fechaTurno, turno.horaTurno);

    turno.estadoTurno = EstadoTurno.CANCELADO;
    const updatedTurno = await this.turnoRepository.save(turno);

    this.logger.log(`Turno ${turnoId} cancelado por socio ${socio.idPersona}.`);
    this.logger.log(
      `Notificacion interna pendiente de integracion para profesional ${turno.nutricionista.idPersona}.`,
    );

    return this.toResponseDto(updatedTurno);
  }

  private async resolveSocioByUserId(userId: number): Promise<SocioOrmEntity> {
    const user = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: {
        persona: true,
      },
    });

    const personaId = user?.persona?.idPersona;

    if (!personaId) {
      throw new ForbiddenError(
        'El usuario autenticado no tiene un socio asociado.',
      );
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: personaId },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(personaId));
    }

    return socio;
  }

  private validate24hRule(fechaTurno: Date, horaTurno: string): void {
    const scheduledDate = combineArgentinaDateAndTime(fechaTurno, horaTurno);
    const now = new Date();
    const hoursDiff =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      throw new BadRequestError(
        'Solo se puede cancelar con al menos 24 horas de anticipacion.',
      );
    }
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
