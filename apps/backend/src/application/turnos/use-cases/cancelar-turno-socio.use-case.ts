import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  POLITICA_OPERATIVA_REPOSITORY,
  IPoliticaOperativaRepository,
} from 'src/application/politicas/politica-operativa.repository';
import {
  CancelarTurnoSocioDto,
  TurnoOperacionResponseDto,
} from 'src/application/turnos/dtos';
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
  TurnoConfirmacionTokenOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';

@Injectable()
export class CancelarTurnoSocioUseCase implements BaseUseCase {
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
    @Inject(POLITICA_OPERATIVA_REPOSITORY)
    private readonly politicaRepository: IPoliticaOperativaRepository,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(
    userId: number | null,
    turnoId: number,
    tokenConfirmacion?: string,
    dto?: CancelarTurnoSocioDto,
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
      throw new ForbiddenError('No tiene permisos para cancelar este turno.');
    }

    if (tokenConfirmacion) {
      await this.validarTokenConfirmacion(turnoId, tokenConfirmacion);
    }

    if (turno.estadoTurno !== EstadoTurno.PROGRAMADO) {
      throw new BadRequestError(
        'Solo se pueden cancelar turnos en estado PROGRAMADO.',
      );
    }

    if (!tokenConfirmacion) {
      await this.validatePolicyRule(turno);
    }

    turno.estadoTurno = EstadoTurno.CANCELADO;
    turno.motivoCancelacion = dto?.motivo ?? 'Cancelado por socio';
    const updatedTurno = await this.turnoRepository.save(turno);

    const usuarioId = userId ?? null;
    await this.auditoriaService.registrar({
      usuarioId,
      accion: AccionAuditoria.TURNO_ESTADO_CAMBIO,
      entidad: 'Turno',
      entidadId: turnoId,
      metadata: {
        estadoAnterior: EstadoTurno.PROGRAMADO,
        estadoNuevo: EstadoTurno.CANCELADO,
        motivo: turno.motivoCancelacion,
      },
    });

    if (turno.socio.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.socio.idPersona,
        tipo: TipoNotificacion.TURNO_CANCELADO,
        titulo: 'Turno cancelado',
        mensaje: `Tu turno del ${formatArgentinaDate(turno.fechaTurno)} a las ${normalizeTimeToHHmm(turno.horaTurno)} fue cancelado.`,
        metadata: { turnoId: turno.idTurno },
      });
    }

    if (turno.nutricionista.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.nutricionista.idPersona,
        tipo: TipoNotificacion.TURNO_CANCELADO,
        titulo: 'Turno cancelado por socio',
        mensaje: `El socio canceló el turno #${turno.idTurno}${turno.motivoCancelacion ? `. Motivo: ${turno.motivoCancelacion}` : ''}.`,
        metadata: { turnoId: turno.idTurno },
      });
    }

    this.logger.log(
      `Turno ${turnoId} cancelado por socio ${socio?.idPersona ?? 'token'}.`,
    );
    this.logger.log(
      `Notificacion interna pendiente de integracion para profesional ${turno.nutricionista.idPersona}.`,
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

    if (!registro) throw new BadRequestError('Token de confirmación inválido.');
    if (registro.usadoEn)
      throw new BadRequestError('El token ya fue utilizado.');
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

  private async validatePolicyRule(turno: TurnoOrmEntity): Promise<void> {
    const gimnasioId = turno.gimnasio?.idGimnasio ?? 1;
    const plazoHoras =
      await this.politicaRepository.getPlazoCancelacion(gimnasioId);
    const scheduledDate = combineArgentinaDateAndTime(
      turno.fechaTurno,
      turno.horaTurno,
    );
    const now = new Date();
    const hoursDiff =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < plazoHoras) {
      throw new BadRequestError(
        `Solo se puede cancelar con al menos ${plazoHoras} horas de anticipacion.`,
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
    response.gimnasioId = turno.gimnasio?.idGimnasio;
    response.motivoCancelacion = turno.motivoCancelacion ?? undefined;
    return response;
  }
}
