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
  getArgentinaTodayDate,
  normalizeTimeToHHmm,
} from 'src/common/utils/argentina-datetime.util';
import {
  SocioOrmEntity,
  TurnoConfirmacionTokenOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

@Injectable()
export class ConfirmarTurnoSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(TurnoConfirmacionTokenOrmEntity)
    private readonly tokenRepository: Repository<TurnoConfirmacionTokenOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    userId: number | null,
    turnoId: number,
    tokenConfirmacion?: string,
  ): Promise<TurnoOperacionResponseDto> {
    const socio = userId ? await this.resolveSocioByUserId(userId) : null;

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

    if (socio && turno.socio.idPersona !== socio.idPersona) {
      throw new ForbiddenError('No tiene permisos para confirmar este turno.');
    }

    if (tokenConfirmacion) {
      await this.validarTokenConfirmacion(turnoId, tokenConfirmacion);
    }

    if (turno.estadoTurno !== EstadoTurno.PROGRAMADO) {
      throw new BadRequestError(
        'Solo se pueden confirmar turnos en estado PROGRAMADO.',
      );
    }

    this.validateConfirmationWindow(turno.fechaTurno, turno.horaTurno);

    turno.estadoTurno = EstadoTurno.PRESENTE;
    (turno as any).confirmedAt = new Date();
    const updatedTurno = await this.turnoRepository.save(turno);

    if (turno.socio.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.socio.idPersona,
        tipo: TipoNotificacion.TURNO_RESERVADO,
        titulo: 'Turno confirmado',
        mensaje: `Tu turno del ${formatArgentinaDate(turno.fechaTurno)} a las ${normalizeTimeToHHmm(turno.horaTurno)} fue confirmado.`,
        metadata: { turnoId: turno.idTurno },
      });
    }

    if (turno.nutricionista.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.nutricionista.idPersona,
        tipo: TipoNotificacion.TURNO_RESERVADO,
        titulo: 'Turno confirmado por socio',
        mensaje: `El socio confirmó el turno #${turno.idTurno} del ${formatArgentinaDate(turno.fechaTurno)} a las ${normalizeTimeToHHmm(turno.horaTurno)}.`,
        metadata: { turnoId: turno.idTurno },
      });
    }

    this.logger.log(
      `Turno ${turnoId} confirmado por socio ${socio?.idPersona ?? 'token'}.`,
    );

    return this.toResponseDto(updatedTurno);
  }

  private async validarTokenConfirmacion(
    turnoId: number,
    tokenPlano: string,
  ): Promise<void> {
    const tokenHash = createHash('sha256').update(tokenPlano).digest('hex');
    const registro = await this.tokenRepository.findOne({
      where: { turnoId, tokenHash },
    });

    if (!registro) {
      throw new BadRequestError('Token de confirmación inválido.');
    }

    if (registro.usadoEn) {
      throw new BadRequestError('El token ya fue utilizado.');
    }

    if (registro.expiraEn.getTime() < Date.now()) {
      throw new BadRequestError('El token de confirmación expiró.');
    }

    registro.usadoEn = new Date();
    await this.tokenRepository.save(registro);
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

  private validateConfirmationWindow(
    fechaTurno: Date,
    horaTurno: string,
  ): void {
    const now = new Date();
    const scheduledDate = combineArgentinaDateAndTime(fechaTurno, horaTurno);

    if (getArgentinaTodayDate(now) !== formatArgentinaDate(scheduledDate)) {
      throw new BadRequestError(
        'Solo se puede confirmar asistencia el dia del turno.',
      );
    }

    if (now.getTime() >= scheduledDate.getTime()) {
      throw new BadRequestError(
        'La confirmacion debe realizarse antes del horario del turno.',
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
