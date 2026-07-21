import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrearTurnoEnNombreDeSocioDto } from 'src/application/turnos/dtos/crear-turno-en-nombre-de-socio.dto';
import { CrearTurnoEnNombreDeSocioResponseDto } from 'src/application/turnos/dtos/crear-turno-en-nombre-de-socio-response.dto';
import { ValidacionesCreacionTurno } from 'src/application/turnos/helpers/validaciones-creacion-turno.helper';
import { ActorStaff } from 'src/application/turnos/types/actor-staff';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { EmailService } from 'src/application/email/email.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { CreadoPor } from 'src/domain/entities/Turno/creado-por.enum';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { Rol } from 'src/domain/entities/Usuario/Rol';
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
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  NutricionistaOrmEntity,
  SocioOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';

/**
 * Use-case del nuevo endpoint `POST /turnos/crear` (change
 * `crear-turno-en-nombre-del-socio`).
 *
 * Permite a un actor interno (`RECEPCIONISTA`, `ADMIN`, `NUTRICIONISTA`)
 * agendar un turno en nombre de un socio, respetando:
 *  - la pipeline canonica de validaciones via `ValidacionesCreacionTurno`
 *    (RB05/06/07/17/27/28/40/58/59),
 *  - la validacion de scope cross-gym (socio y nutri deben pertenecer
 *    al gimnasio del actor),
 *  - la politica RB14 diferenciada: BLOCK estricto para
 *    `NUTRICIONISTA`, WARN no-bloqueante (flag `warning: 'socio_sin_ficha'`)
 *    para `RECEPCION` / `ADMIN`,
 *  - la trazabilidad del origen via `turno.creado_por` y una fila de
 *    auditoria con `metadata.tipo = 'CREACION_POR_STAFF'`.
 *
 * Decisiones del spec literal que se aplican (sobreescriben la design):
 *  - El nutricionista RECIBE notificacion cuando un tercero agenda un
 *    turno en su agenda (email). El design §11.G proponia NO notificar
 *    al nutri por consistencia con `AsignarTurnoManual`; el orquestador
 *    sobreescribio esa decision a favor del spec literal
 *    `crear-turno-en-nombre-del-socio-endpoint.md` §Eventos punto 2.
 *  - Los recordatorios 24h+1h los dispara el cron scheduler existente
 *    (`TurnoReminderScheduler`) que ya recorre todos los turnos no
 *    cancelados/ausentes. El use-case NO agenda recordatorios de forma
 *    explicita; el turno creado con `estadoTurno = CONFIRMADO` es
 *    suficiente para que el cron lo recoja. Los recordatorios van
 *    SOLO al socio (no al nutri) por comportamiento estandar.
 *
 * RBs cubiertos: RB05, RB06, RB07, RB14, RB17, RB27, RB28, RB33, RB40.
 */
@Injectable()
export class CrearTurnoEnNombreDeSocioUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    private readonly validaciones: ValidacionesCreacionTurno,
    private readonly notificacionesService: NotificacionesService,
    private readonly emailService: EmailService,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    actor: ActorStaff,
    payload: CrearTurnoEnNombreDeSocioDto,
  ): Promise<CrearTurnoEnNombreDeSocioResponseDto> {
    // 1. Resolver el nutricionista via repositorio de dominio.
    const nutricionistaDominio = await this.nutricionistaRepository.findById(
      payload.nutricionistaId,
    );
    if (!nutricionistaDominio || nutricionistaDominio.fechaBaja) {
      throw new NotFoundError('Profesional', String(payload.nutricionistaId));
    }

    // 2. Resolver el socio con la ficha de salud (necesaria para RB14).
    const socio = await this.socioRepository.findOne({
      where: {
        idPersona: payload.socioId,
        gimnasioId: actor.gimnasioId,
      },
      relations: { fichaSalud: true, usuario: true },
    });
    if (!socio) {
      throw new NotFoundError('Socio', String(payload.socioId));
    }

    // 3. Validacion de scope de gimnasio (RB cross-gym, B4/B6 del spec).
    this.validarScopeGimnasio(actor, socio, nutricionistaDominio);

    // 4. Validacion RB14 diferenciada por rol. Lanza BadRequestError
    //    para NUTRICIONISTA, retorna flag para RECEPCION/ADMIN.
    const fichaAdvertencia = this.validarFicha(actor, socio);

    // 5. Pipeline canonica del helper compartido.
    const fechaTurno = parseArgentinaDateInput(payload.fechaTurno);
    const horaTurno = normalizeTimeToHHmm(payload.horaTurno);
    await this.validaciones.validarFechaHoraNoPasado(fechaTurno, horaTurno);
    await this.validaciones.validarAgendaDisponible(
      payload.nutricionistaId,
      fechaTurno,
      horaTurno,
    );
    await this.validaciones.validarNoConflictoSlot(
      payload.nutricionistaId,
      fechaTurno,
      horaTurno,
    );
    // NOTA: NO se llama `validarNoSolapamientoActivo` del helper porque
    // un admin puede agendar legitimamente un turno para un socio que
    // ya tiene otro activo con otro nutri (decision design §4 paso 5).
    // La validacion de "reserva activa del socio" solo aplica a CU-11.

    // 6. Construir el TurnoOrmEntity con la FK al nutri (necesitamos
    //    la entidad ORM, no solo la de dominio).
    const nutricionistaOrm = await this.nutricionistaOrmRepository.findOne({
      where: { idPersona: payload.nutricionistaId },
      relations: { usuario: true },
    });
    if (!nutricionistaOrm) {
      throw new NotFoundError('Profesional', String(payload.nutricionistaId));
    }

    const creadoPor = this.mapearRolACreadoPor(actor.rol);
    const turno = new TurnoOrmEntity();
    turno.fechaTurno = fechaTurno;
    turno.horaTurno = horaTurno;
    turno.estadoTurno = EstadoTurno.CONFIRMADO;
    turno.socio = socio;
    turno.nutricionista = nutricionistaOrm;
    turno.creadoPor = creadoPor;

    // 7. Persistir.
    const turnoCreado = await this.turnoRepository.save(turno);

    // 8. Notificar al socio (in-app + email) y al nutri (email).
    //    Operaciones best-effort: si fallan, se loguea y se continua,
    //    para no abortar la creacion del turno por un fallo secundario.
    await this.notificarSocioTurnoReservado(turnoCreado, socio, creadoPor);
    await this.notificarSocioNuevoTurnoEmail(
      turnoCreado,
      socio,
      nutricionistaOrm,
      actor.gimnasioId,
    );
    await this.notificarNutriNuevoTurno(
      turnoCreado,
      socio,
      nutricionistaOrm,
      creadoPor,
      actor.gimnasioId,
    );

    // 9. Auditar la creacion (RB33).
    //    `socio.idPersona` es `number | null` por la definicion del PK
    //    en `PersonaOrmEntity`; en practica nunca sera null aca porque
    //    el socio se acabo de resolver desde la DB. Se usa `?? 0` para
    //    mantener el shape tipado del metadata sin introducir una
    //    asercion no-segura.
    await this.auditarCreacionPorStaff(
      actor,
      turnoCreado,
      socio.idPersona ?? 0,
      payload.nutricionistaId,
      actor.gimnasioId,
      !socio.fichaSalud || !socio.fichaSalud.completada,
    );

    this.logger.log(
      `Turno creado por ${actor.rol} (usuario=${actor.usuarioId}). Turno=${turnoCreado.idTurno}, socio=${payload.socioId}, nutri=${payload.nutricionistaId}.`,
    );

    return this.toResponseDto(
      turnoCreado,
      creadoPor,
      actor.gimnasioId,
      fichaAdvertencia,
    );
  }

  // --- Metodos privados ---

  /**
   * Valida que socio y nutri pertenezcan al gimnasio del actor.
   * Misma regla para RECEPCION, NUTRICIONISTA y ADMIN (decision
   * design §11.E: ADMIN opera de forma conservadora en su gimnasio).
   * SUPERADMIN no llega hasta aca porque `ActionsGuard` ya lo permite
   * solo si tiene el permiso `turnos.crear` y ademas la capa de
   * gimnasio queda enforced por el `TenantContext`.
   */
  private validarScopeGimnasio(
    actor: ActorStaff,
    socio: SocioOrmEntity,
    nutri: { gimnasioId: number | null },
  ): void {
    if (socio.gimnasioId !== actor.gimnasioId) {
      throw new ForbiddenError('El socio no pertenece a tu gimnasio.');
    }
    if (nutri.gimnasioId !== actor.gimnasioId) {
      throw new ForbiddenError('El profesional no pertenece a tu gimnasio.');
    }
  }

  /**
   * Politica RB14 diferenciada:
   *  - NUTRICIONISTA: throw 400 con mensaje claro (es la unica via
   *    clinica valida; no se puede atender sin ficha).
   *  - RECEPCION / ADMIN: retorna el flag 'socio_sin_ficha' para que
   *    el response DTO lo exponga. La creacion del turno CONTINUA.
   */
  private validarFicha(
    actor: ActorStaff,
    socio: SocioOrmEntity,
  ): 'socio_sin_ficha' | null {
    const fichaIncompleta = !socio.fichaSalud || !socio.fichaSalud.completada;
    if (!fichaIncompleta) {
      return null;
    }

    if (actor.rol === Rol.NUTRICIONISTA) {
      throw new BadRequestError(
        'El paciente no ha completado su ficha médica. No es posible agendar una consulta clínica sin este requisito.',
      );
    }

    return 'socio_sin_ficha';
  }

  private mapearRolACreadoPor(rol: Rol): CreadoPor {
    switch (rol) {
      case Rol.RECEPCIONISTA:
        return CreadoPor.RECEPCION;
      case Rol.ADMIN:
        return CreadoPor.ADMIN;
      case Rol.NUTRICIONISTA:
        return CreadoPor.NUTRICIONISTA;
      default:
        throw new BadRequestError(
          `Rol no soportado para crear turno en nombre del socio: ${rol}`,
        );
    }
  }

  private async notificarSocioTurnoReservado(
    turno: TurnoOrmEntity,
    socio: SocioOrmEntity,
    creadoPor: CreadoPor,
  ): Promise<void> {
    if (!socio.idPersona || socio.usuario?.idUsuario == null) {
      return;
    }
    try {
      await this.notificacionesService.crear({
        destinatarioId: socio.usuario.idUsuario,
        tipo: TipoNotificacion.TURNO_RESERVADO,
        titulo: this.tituloNotificacionParaSocio(creadoPor),
        mensaje: this.mensajeNotificacionParaSocio(turno, creadoPor),
        metadata: {
          turnoId: turno.idTurno,
          creadoPor,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Fallo la notificacion in-app al socio ${socio.idPersona} para turno ${turno.idTurno}: ${(error as Error).message}`,
      );
    }
  }

  private async notificarNutriNuevoTurno(
    turno: TurnoOrmEntity,
    socio: SocioOrmEntity,
    nutricionista: NutricionistaOrmEntity,
    creadoPor: CreadoPor,
    gimnasioId: number,
  ): Promise<void> {
    // Si el actor es el mismo nutri, el email es auto-recibido: lo
    // enviamos igual para que quede traza. La design §11.G decia
    // "no auto-notificar al actor" pero el spec literal manda
    // notificar al nutri siempre, y la sobreescritura explicita del
    // orquestador lo confirma (consign de PR-2).
    const email = nutricionista.usuario?.email;
    if (!email) {
      this.logger.warn(
        `Nutricionista ${nutricionista.idPersona} sin email; notificacion de nuevo turno omitida.`,
      );
      return;
    }
    try {
      await this.emailService.enviarNotificacionTurnoParaNutri({
        email,
        nombreNutricionista:
          `${nutricionista.nombre} ${nutricionista.apellido}`.trim(),
        nombreSocio: `${socio.nombre} ${socio.apellido}`.trim(),
        dniSocio: socio.dni ?? null,
        fecha: formatArgentinaDate(turno.fechaTurno),
        hora: normalizeTimeToHHmm(turno.horaTurno),
        creadoPor,
        gimnasioId,
      });
    } catch (error) {
      this.logger.warn(
        `Fallo el email al nutricionista ${nutricionista.idPersona} para turno ${turno.idTurno}: ${(error as Error).message}`,
      );
    }
  }

  private async notificarSocioNuevoTurnoEmail(
    turno: TurnoOrmEntity,
    socio: SocioOrmEntity,
    nutricionista: NutricionistaOrmEntity,
    gimnasioId: number,
  ): Promise<void> {
    const email = socio.usuario?.email;
    if (!email) {
      this.logger.warn(
        `Socio ${socio.idPersona} sin email; notificacion de nuevo turno por email omitida.`,
      );
      return;
    }
    try {
      await this.emailService.enviarNotificacionTurnoParaSocio({
        email,
        nombreSocio: `${socio.nombre} ${socio.apellido}`.trim(),
        nombreNutricionista:
          `${nutricionista.nombre} ${nutricionista.apellido}`.trim(),
        fecha: formatArgentinaDate(turno.fechaTurno),
        hora: normalizeTimeToHHmm(turno.horaTurno),
        gimnasioId,
      });
    } catch (error) {
      this.logger.warn(
        `Fallo el email al socio ${socio.idPersona} para turno ${turno.idTurno}: ${(error as Error).message}`,
      );
    }
  }

  private async auditarCreacionPorStaff(
    actor: ActorStaff,
    turno: TurnoOrmEntity,
    socioId: number,
    nutricionistaId: number,
    gimnasioId: number,
    fichaIncompleta: boolean,
  ): Promise<void> {
    try {
      await this.auditoriaService.registrar({
        usuarioId: actor.usuarioId,
        accion: AccionAuditoria.TURNO_ESTADO_CAMBIO,
        entidad: 'turno',
        entidadId: turno.idTurno,
        metadata: {
          tipo: 'CREACION_POR_STAFF',
          creadoPor: this.mapearRolACreadoPor(actor.rol),
          creadoPorUsuarioId: actor.usuarioId,
          creadoPorRol: actor.rol,
          antesJson: null,
          despuesJson: {
            idTurno: turno.idTurno,
            fechaTurno: formatArgentinaDate(turno.fechaTurno),
            horaTurno: normalizeTimeToHHmm(turno.horaTurno),
            estadoTurno: turno.estadoTurno,
            socioId,
            nutricionistaId,
            gimnasioId,
            fichaIncompleta,
          },
        },
      });
    } catch (error) {
      this.logger.warn(
        `Fallo la auditoria para turno ${turno.idTurno}: ${(error as Error).message}`,
      );
    }
  }

  private tituloNotificacionParaSocio(creadoPor: CreadoPor): string {
    switch (creadoPor) {
      case CreadoPor.RECEPCION:
        return 'Turno agendado por recepción';
      case CreadoPor.ADMIN:
        return 'Turno agendado por administración';
      case CreadoPor.NUTRICIONISTA:
        return 'Turno agendado por tu nutricionista';
      default:
        return 'Turno agendado';
    }
  }

  private mensajeNotificacionParaSocio(
    turno: TurnoOrmEntity,
    creadoPor: CreadoPor,
  ): string {
    const lugar =
      creadoPor === CreadoPor.RECEPCION
        ? 'en recepción'
        : creadoPor === CreadoPor.ADMIN
          ? 'desde administración'
          : 'con tu nutricionista';
    return `Te agendaron un turno ${lugar} para el ${formatArgentinaDate(turno.fechaTurno)} a las ${normalizeTimeToHHmm(turno.horaTurno)}.`;
  }

  private toResponseDto(
    turno: TurnoOrmEntity,
    creadoPor: CreadoPor,
    gimnasioId: number,
    warning: 'socio_sin_ficha' | null,
  ): CrearTurnoEnNombreDeSocioResponseDto {
    const response = new CrearTurnoEnNombreDeSocioResponseDto();
    response.idTurno = turno.idTurno;
    response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
    response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
    response.estadoTurno = turno.estadoTurno;
    response.socioId = turno.socio.idPersona ?? 0;
    response.nutricionistaId = turno.nutricionista.idPersona ?? 0;
    response.gimnasioId = gimnasioId;
    response.creadoPor = creadoPor;
    if (warning) {
      response.warning = warning;
    }
    return response;
  }
}
