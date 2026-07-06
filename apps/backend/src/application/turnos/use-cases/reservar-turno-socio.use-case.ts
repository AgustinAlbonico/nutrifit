import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ReservarTurnoSocioDto,
  TurnoOperacionResponseDto,
} from 'src/application/turnos/dtos';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
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
  parseArgentinaDateInput,
} from 'src/common/utils/argentina-datetime.util';
import {
  NutricionistaOrmEntity,
  SocioOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { In, Repository } from 'typeorm';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { ValidacionesCreacionTurno } from '../helpers/validaciones-creacion-turno.helper';
import { EmailService } from 'src/application/email/email.service';

@Injectable()
export class ReservarTurnoSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly notificacionesService: NotificacionesService,
    private readonly tenantContext: TenantContextService,
    private readonly validaciones: ValidacionesCreacionTurno,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    userId: number,
    payload: ReservarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    const socio = await this.resolveSocioByUserId(userId);

    if (!socio.fichaSalud || !socio.fichaSalud.completada) {
      throw new BadRequestError(
        'Debés completar y tener completada tu ficha de salud antes de reservar un turno.',
      );
    }

    const nutricionista = await this.nutricionistaRepository.findById(
      payload.nutricionistaId,
    );

    if (!nutricionista || nutricionista.fechaBaja) {
      throw new NotFoundError('Profesional', String(payload.nutricionistaId));
    }

    const fechaTurno = parseArgentinaDateInput(payload.fechaTurno);
    const horaTurno = normalizeTimeToHHmm(payload.horaTurno);

    await this.validaciones.validarFechaHoraNoPasado(fechaTurno, horaTurno);
    await this.validaciones.validarAgendaDisponible(
      payload.nutricionistaId,
      fechaTurno,
      horaTurno,
    );

    // RB14 + reserva activa: chequeo inline especifico de CU-11. El staff
    // que crea turnos en nombre del socio NO aplica esta validacion (un
    // admin puede legítimamente agendar un turno para un socio que ya
    // tiene otro activo con otro nutri). Por eso vive aqui, no en el
    // helper compartido.
    const activeReserva = await this.turnoRepository.findOne({
      where: {
        socio: {
          idPersona: socio.idPersona ?? 0,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        estadoTurno: In([
          EstadoTurno.CONFIRMADO,
          EstadoTurno.PRESENTE,
          EstadoTurno.EN_CURSO,
        ]),
      },
    });

    if (activeReserva) {
      throw new BadRequestError(
        'Ya tenés una reserva activa. Cancelá tu turno actual o esperá a que finalice antes de reservar otro.',
      );
    }

    await this.validaciones.validarNoConflictoSlot(
      payload.nutricionistaId,
      fechaTurno,
      horaTurno,
    );

    const nutricionistaOrm = await this.nutricionistaOrmRepository.findOne({
      where: { idPersona: payload.nutricionistaId },
    });

    if (!nutricionistaOrm) {
      throw new NotFoundError('Profesional', String(payload.nutricionistaId));
    }

    const turno = new TurnoOrmEntity();
    turno.fechaTurno = fechaTurno;
    turno.horaTurno = horaTurno;
    turno.estadoTurno = EstadoTurno.CONFIRMADO;
    turno.socio = socio;
    turno.nutricionista = nutricionistaOrm;

    const turnoCreado = await this.turnoRepository.save(turno);

    if (socio.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: userId,
        tipo: TipoNotificacion.TURNO_RESERVADO,
        titulo: 'Turno reservado',
        mensaje: `Reservaste un turno para el ${formatArgentinaDate(turnoCreado.fechaTurno)} a las ${normalizeTimeToHHmm(turnoCreado.horaTurno)}.`,
        metadata: { turnoId: turnoCreado.idTurno },
      });
    }

    if (socio.usuario?.email) {
      try {
        await this.emailService.enviarNotificacionTurnoParaSocio({
          email: socio.usuario.email,
          nombreSocio: `${socio.nombre} ${socio.apellido}`.trim(),
          nombreNutricionista: `${nutricionistaOrm.nombre} ${nutricionistaOrm.apellido}`.trim(),
          fecha: formatArgentinaDate(turnoCreado.fechaTurno),
          hora: normalizeTimeToHHmm(turnoCreado.horaTurno),
          gimnasioId: socio.gimnasioId ?? undefined,
        });
      } catch (error) {
        this.logger.warn(
          `Fallo el email al socio ${socio.idPersona} para turno ${turnoCreado.idTurno}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Turno reservado por socio ${socio.idPersona}. Turno=${turnoCreado.idTurno}, profesional=${payload.nutricionistaId}.`,
    );

    return this.toResponseDto(turnoCreado);
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
      where: {
        idPersona: personaId,
        gimnasioId: this.tenantContext.gimnasioId,
      },
      relations: {
        fichaSalud: true,
        usuario: true,
      },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(personaId));
    }

    return socio;
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
