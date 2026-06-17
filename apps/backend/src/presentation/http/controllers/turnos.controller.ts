import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AgendaSlotDto,
  AsignarTurnoManualDto,
  AvisoLlegadaTardeDto,
  BloquearTurnoDto,
  CancelarTurnoSocioDto,
  CrearTurnoEnNombreDeSocioDto,
  CrearTurnoEnNombreDeSocioResponseDto,
  DatosTurnoResponseDto,
  DatosTurnoSocioResponseDto,
  DatosVersionFichaSaludDto,
  FichaSaludPacienteResponseDto,
  FichaSaludSocioResponseDto,
  GetTurnosDelDiaQueryDto,
  GetAgendaDiariaQueryDto,
  GuardarMedicionesDto,
  GuardarObservacionesDto,
  HistorialConsultaPacienteResponseDto,
  HistorialFichaSaludItemDto,
  ListMisTurnosQueryDto,
  ListPacientesProfesionalQueryDto,
  MarcarAusenteManualDto,
  MiTurnoResponseDto,
  PacienteProfesionalResponseDto,
  RecepcionTurnoResponseDto,
  ReprogramarTurnoSocioDto,
  ConfirmarTurnoTokenDto,
  RegistrarAsistenciaTurnoDto,
  ReservarTurnoSocioDto,
  RevertirAusenteDto,
  RevertirCheckinDto,
  TurnoDelDiaResponseDto,
  TurnoOperacionResponseDto,
  UpsertFichaSaludSocioDto,
} from 'src/application/turnos/dtos';
import {
  AbrirFichaDesdeTurnoUseCase,
  AsignarTurnoManualUseCase,
  AvisoLlegadaTardeUseCase,
  BloquearTurnoUseCase,
  CancelarTurnoSocioUseCase,
  CheckInTurnoUseCase,
  ConfirmarTurnoSocioUseCase,
  CrearTurnoEnNombreDeSocioUseCase,
  DesbloquearTurnoUseCase,
  FinalizarConsultaUseCase,
  GetAgendaDiariaUseCase,
  GetFichaSaludPacienteUseCase,
  GetFichaSaludSocioUseCase,
  GetHistorialConsultasPacienteUseCase,
  GetHistorialMedicionesUseCase,
  GetResumenProgresoUseCase,
  GetTurnoByIdUseCase,
  GetTurnoSocioByIdUseCase,
  GetTurnosDelDiaUseCase,
  GetTurnosRecepcionDiaUseCase,
  GuardarMedicionesUseCase,
  GuardarObservacionesUseCase,
  IniciarConsultaUseCase,
  ListarHistorialFichaSaludNutricionistaUseCase,
  ListarHistorialFichaSaludSocioUseCase,
  ListMisTurnosUseCase,
  ListPacientesProfesionalUseCase,
  MarcarAusenteManualUseCase,
  NotificarSocioInasistenciaUseCase,
  ObtenerVersionFichaSaludNutricionistaUseCase,
  ObtenerVersionFichaSaludSocioUseCase,
  ReprogramarTurnoSocioUseCase,
  RegistrarAsistenciaTurnoUseCase,
  ReservarTurnoSocioUseCase,
  RevertirAusenteTurnoUseCase,
  RevertirCheckinTurnoUseCase,
  UpsertFichaSaludSocioUseCase,
} from 'src/application/turnos/use-cases';
import { ActorStaff } from 'src/application/turnos/types/actor-staff';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import {
  CurrentUser,
  CurrentUserId,
  type UsuarioAutenticadoPayload,
} from 'src/infrastructure/auth/decorators/current-user.decorator';
import {
  ResourceAccess,
  type ContextoAccesoRecurso,
} from 'src/infrastructure/auth/decorators/resource-access.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { NutricionistaOwnershipGuard } from 'src/infrastructure/auth/guards/nutricionista-ownership.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { SocioResourceAccessGuard } from 'src/infrastructure/auth/guards/socio-resource-access.guard';
import { TurnoNutricionistaAccessGuard } from 'src/infrastructure/auth/guards/turno-nutricionista-access.guard';
import { AdjuntoClinicoService } from 'src/infrastructure/services/adjunto-clinico/adjunto-clinico.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Controller('turnos')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class TurnosController {
  constructor(
    private readonly getTurnosDelDiaUseCase: GetTurnosDelDiaUseCase,
    private readonly getAgendaDiariaUseCase: GetAgendaDiariaUseCase,
    private readonly getTurnosRecepcionDiaUseCase: GetTurnosRecepcionDiaUseCase,
    private readonly asignarTurnoManualUseCase: AsignarTurnoManualUseCase,
    private readonly avisoLlegadaTardeUseCase: AvisoLlegadaTardeUseCase,
    private readonly bloquearTurnoUseCase: BloquearTurnoUseCase,
    private readonly desbloquearTurnoUseCase: DesbloquearTurnoUseCase,
    private readonly cancelarTurnoSocioUseCase: CancelarTurnoSocioUseCase,
    private readonly checkInTurnoUseCase: CheckInTurnoUseCase,
    private readonly confirmarTurnoSocioUseCase: ConfirmarTurnoSocioUseCase,
    private readonly crearTurnoEnNombreDeSocioUseCase: CrearTurnoEnNombreDeSocioUseCase,
    private readonly finalizarConsultaUseCase: FinalizarConsultaUseCase,
    private readonly getFichaSaludPacienteUseCase: GetFichaSaludPacienteUseCase,
    private readonly getFichaSaludSocioUseCase: GetFichaSaludSocioUseCase,
    private readonly getHistorialConsultasPacienteUseCase: GetHistorialConsultasPacienteUseCase,
    private readonly getHistorialMedicionesUseCase: GetHistorialMedicionesUseCase,
    private readonly getResumenProgresoUseCase: GetResumenProgresoUseCase,
    private readonly getTurnoByIdUseCase: GetTurnoByIdUseCase,
    private readonly getTurnoSocioByIdUseCase: GetTurnoSocioByIdUseCase,
    private readonly guardarMedicionesUseCase: GuardarMedicionesUseCase,
    private readonly guardarObservacionesUseCase: GuardarObservacionesUseCase,
    private readonly iniciarConsultaUseCase: IniciarConsultaUseCase,
    private readonly listarHistorialFichaSaludNutricionistaUseCase: ListarHistorialFichaSaludNutricionistaUseCase,
    private readonly listarHistorialFichaSaludSocioUseCase: ListarHistorialFichaSaludSocioUseCase,
    private readonly listMisTurnosUseCase: ListMisTurnosUseCase,
    private readonly listPacientesProfesionalUseCase: ListPacientesProfesionalUseCase,
    private readonly marcarAusenteManualUseCase: MarcarAusenteManualUseCase,
    private readonly notificarSocioInasistenciaUseCase: NotificarSocioInasistenciaUseCase,
    private readonly obtenerVersionFichaSaludNutricionistaUseCase: ObtenerVersionFichaSaludNutricionistaUseCase,
    private readonly obtenerVersionFichaSaludSocioUseCase: ObtenerVersionFichaSaludSocioUseCase,
    private readonly reprogramarTurnoSocioUseCase: ReprogramarTurnoSocioUseCase,
    private readonly registrarAsistenciaTurnoUseCase: RegistrarAsistenciaTurnoUseCase,
    private readonly reservarTurnoSocioUseCase: ReservarTurnoSocioUseCase,
    private readonly revertirAusenteTurnoUseCase: RevertirAusenteTurnoUseCase,
    private readonly revertirCheckinTurnoUseCase: RevertirCheckinTurnoUseCase,
    private readonly upsertFichaSaludSocioUseCase: UpsertFichaSaludSocioUseCase,
    private readonly adjuntoClinicoService: AdjuntoClinicoService,
    private readonly tenantContext: TenantContextService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  @Get('profesional/:nutricionistaId/hoy')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async getTurnosDelDia(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Query() query: GetTurnosDelDiaQueryDto,
  ): Promise<TurnoDelDiaResponseDto[]> {
    this.logger.log(
      `Consultando turnos del dia para profesional ${nutricionistaId}.`,
    );

    return this.getTurnosDelDiaUseCase.execute(nutricionistaId, query);
  }

  @Get('socio/turno/:id')
  @Rol(RolEnum.SOCIO)
  async getTurnoSocioById(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) turnoId: number,
  ): Promise<DatosTurnoSocioResponseDto> {
    this.logger.log(
      `Consultando turno ${turnoId} para socio usuario=${userId}.`,
    );

    return this.getTurnoSocioByIdUseCase.execute(userId, turnoId);
  }

  @Get(':id')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async getTurnoById(
    @Param('id', ParseIntPipe) turnoId: number,
    @ResourceAccess() access: ContextoAccesoRecurso,
  ): Promise<DatosTurnoResponseDto> {
    const nutricionistaId = access.actorPersonaId;

    if (nutricionistaId == null) {
      throw new ForbiddenException('No se pudo resolver el profesional.');
    }

    this.logger.log(
      `Consultando turno completo ${turnoId} para nutricionista ${nutricionistaId}.`,
    );

    return this.getTurnoByIdUseCase.execute(turnoId, nutricionistaId);
  }

  @Get('profesional/:nutricionistaId/disponibilidad')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async getAgendaDiaria(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Query() query: GetAgendaDiariaQueryDto,
  ): Promise<AgendaSlotDto[]> {
    this.logger.log(
      `Consultando agenda diaria para profesional ${nutricionistaId} en fecha ${query.fecha}.`,
    );

    return this.getAgendaDiariaUseCase.execute(nutricionistaId, query);
  }

  @Post('profesional/:nutricionistaId/asignar-manual')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async asignarTurnoManual(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Body() payload: AsignarTurnoManualDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Asignando turno manual para profesional ${nutricionistaId} y socio ${payload.socioId}.`,
    );

    return this.asignarTurnoManualUseCase.execute(nutricionistaId, payload);
  }

  /**
   * Endpoint unificado `POST /turnos/crear` del change
   * `crear-turno-en-nombre-del-socio` (PR-2). Permite a un actor
   * interno (RECEPCIONISTA / ADMIN / NUTRICIONISTA) crear un turno
   * en nombre de un socio. La politica RB14 diferenciada (BLOCK para
   * NUTRI, WARN para RECEPCION/ADMIN) vive en el use-case, no en el
   * DTO.
   *
   * Guards:
   *  - `RolesGuard` (clase): restringe a los 3 roles permitidos.
   *  - `ActionsGuard` (clase): exige el permiso `turnos.crear` para
   *    el actor (RECEPCIONISTA y NUTRI lo tienen, ADMIN lo obtiene
   *    via el seed; SOCIO queda excluido por RolesGuard antes de
   *    llegar a este punto).
   *  - Validacion de scope cross-gym (B4/B6) y RB14 diferenciado
   *    viven en `CrearTurnoEnNombreDeSocioUseCase`.
   */
  @Post('crear')
  @HttpCode(HttpStatus.CREATED)
  @Rol(RolEnum.RECEPCIONISTA, RolEnum.ADMIN, RolEnum.NUTRICIONISTA)
  @Actions('turnos.crear')
  async crearTurnoEnNombreDeSocio(
    @CurrentUser() user: UsuarioAutenticadoPayload,
    @Body() payload: CrearTurnoEnNombreDeSocioDto,
  ): Promise<CrearTurnoEnNombreDeSocioResponseDto> {
    const actor: ActorStaff = {
      usuarioId: user.id,
      personaId: user.personaId,
      rol: user.rol,
      gimnasioId: this.tenantContext.gimnasioId,
    };

    this.logger.log(
      `Creando turno por ${actor.rol} (usuario=${actor.usuarioId}). Socio=${payload.socioId}, nutri=${payload.nutricionistaId}.`,
    );

    return this.crearTurnoEnNombreDeSocioUseCase.execute(actor, payload);
  }

  @Post('profesional/:nutricionistaId/bloquear')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async bloquearTurno(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Body() payload: BloquearTurnoDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Bloqueando turno para profesional ${nutricionistaId}. Fecha=${payload.fecha}, hora=${payload.horaTurno}.`,
    );

    return this.bloquearTurnoUseCase.execute(nutricionistaId, payload);
  }

  @Patch('profesional/:nutricionistaId/:turnoId/desbloquear')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async desbloquearTurno(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Desbloqueando turno ${turnoId} para profesional ${nutricionistaId}.`,
    );

    return this.desbloquearTurnoUseCase.execute(nutricionistaId, turnoId);
  }

  @Patch('profesional/:nutricionistaId/:turnoId/asistencia')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async registrarAsistencia(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() payload: RegistrarAsistenciaTurnoDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Registrando asistencia para turno ${turnoId} del profesional ${nutricionistaId}.`,
    );

    return this.registrarAsistenciaTurnoUseCase.execute(
      nutricionistaId,
      turnoId,
      payload,
    );
  }

  @Get('profesional/:nutricionistaId/pacientes/:socioId/ficha-salud')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async getFichaSaludPaciente(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<FichaSaludPacienteResponseDto> {
    this.logger.log(
      `Consultando ficha de salud. Profesional=${nutricionistaId}, socio=${socioId}.`,
    );

    return this.getFichaSaludPacienteUseCase.execute(nutricionistaId, socioId);
  }

  @Get('profesional/:nutricionistaId/pacientes/:socioId/historial-consultas')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async getHistorialConsultasPaciente(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<HistorialConsultaPacienteResponseDto[]> {
    this.logger.log(
      `Consultando historial de consultas. Profesional=${nutricionistaId}, socio=${socioId}.`,
    );

    return this.getHistorialConsultasPacienteUseCase.execute(
      nutricionistaId,
      socioId,
    );
  }

  @Get('profesional/:nutricionistaId/pacientes')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async listPacientesProfesional(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Query() query: ListPacientesProfesionalQueryDto,
  ): Promise<PacienteProfesionalResponseDto[]> {
    this.logger.log(`Listando pacientes de profesional ${nutricionistaId}.`);

    return this.listPacientesProfesionalUseCase.execute(nutricionistaId, query);
  }

  @Put('socio/ficha-salud')
  @Rol(RolEnum.SOCIO)
  async upsertFichaSaludSocio(
    @CurrentUserId() userId: number,
    @Body() payload: UpsertFichaSaludSocioDto,
  ): Promise<FichaSaludSocioResponseDto> {
    this.logger.log(
      `Actualizando ficha de salud para socio usuario=${userId}.`,
    );

    return this.upsertFichaSaludSocioUseCase.execute(userId, payload);
  }

  @Get('socio/ficha-salud')
  @Rol(RolEnum.SOCIO)
  async getFichaSaludSocio(
    @CurrentUserId() userId: number,
  ): Promise<FichaSaludSocioResponseDto | null> {
    this.logger.log(`Consultando ficha de salud para socio usuario=${userId}.`);

    return this.getFichaSaludSocioUseCase.execute(userId);
  }

  // === PR 1b: Historial de versiones (socio) — RB50 ===
  @Get('socio/ficha-salud/historial')
  @Rol(RolEnum.SOCIO)
  async listarHistorialFichaSaludSocio(
    @CurrentUserId() userId: number,
  ): Promise<HistorialFichaSaludItemDto[]> {
    this.logger.log(
      `Consultando historial de ficha de salud para socio usuario=${userId}.`,
    );

    return this.listarHistorialFichaSaludSocioUseCase.execute(userId);
  }

  @Get('socio/ficha-salud/version/:n')
  @Rol(RolEnum.SOCIO)
  async obtenerVersionFichaSaludSocio(
    @CurrentUserId() userId: number,
    @Param('n', ParseIntPipe) n: number,
  ): Promise<DatosVersionFichaSaludDto> {
    this.logger.log(
      `Consultando versión ${n} de ficha de salud para socio usuario=${userId}.`,
    );

    return this.obtenerVersionFichaSaludSocioUseCase.execute(userId, n);
  }

  // === PR 1b: Historial de versiones (nutricionista) — RB13 ===
  @Get('profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/historial')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async listarHistorialFichaSaludPaciente(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<HistorialFichaSaludItemDto[]> {
    this.logger.log(
      `Consultando historial de ficha de salud. Profesional=${nutricionistaId}, socio=${socioId}.`,
    );

    return this.listarHistorialFichaSaludNutricionistaUseCase.execute(
      nutricionistaId,
      socioId,
    );
  }

  @Get('profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/version/:n')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async obtenerVersionFichaSaludPaciente(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Param('socioId', ParseIntPipe) socioId: number,
    @Param('n', ParseIntPipe) n: number,
  ): Promise<DatosVersionFichaSaludDto> {
    this.logger.log(
      `Consultando versión ${n} de ficha de salud. Profesional=${nutricionistaId}, socio=${socioId}.`,
    );

    return this.obtenerVersionFichaSaludNutricionistaUseCase.execute(
      nutricionistaId,
      socioId,
      n,
    );
  }

  @Get('socio/profesional/:nutricionistaId/disponibilidad')
  @Rol(RolEnum.SOCIO)
  async getDisponibilidadProfesionalParaSocio(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Query() query: GetAgendaDiariaQueryDto,
  ): Promise<AgendaSlotDto[]> {
    this.logger.log(
      `Socio consulta disponibilidad del profesional ${nutricionistaId} para fecha ${query.fecha}.`,
    );

    const agendaDiaria = await this.getAgendaDiariaUseCase.execute(
      nutricionistaId,
      query,
    );

    return agendaDiaria.map((slot) => {
      if (slot.estado === 'LIBRE') {
        return slot;
      }

      return {
        horaInicio: slot.horaInicio,
        horaFin: slot.horaFin,
        estado: 'OCUPADO',
      };
    });
  }

  @Get('admin/profesional/:nutricionistaId/disponibilidad')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions('turnos.ver')
  async getDisponibilidadProfesionalParaAdmin(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Query() query: GetAgendaDiariaQueryDto,
  ): Promise<AgendaSlotDto[]> {
    this.logger.log(
      `Admin consulta disponibilidad del profesional ${nutricionistaId} para fecha ${query.fecha}.`,
    );

    return this.getAgendaDiariaUseCase.execute(nutricionistaId, query);
  }

  @Post('socio/reservar')
  @Rol(RolEnum.SOCIO)
  async reservarTurnoSocio(
    @CurrentUserId() userId: number,
    @Body() payload: ReservarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(`Reservando turno para socio usuario=${userId}.`);

    return this.reservarTurnoSocioUseCase.execute(userId, payload);
  }

  @Get('socio/mis-turnos')
  @Rol(RolEnum.SOCIO)
  async listMisTurnos(
    @CurrentUserId() userId: number,
    @Query() query: ListMisTurnosQueryDto,
  ): Promise<MiTurnoResponseDto[]> {
    this.logger.log(`Consultando mis turnos para socio usuario=${userId}.`);

    return this.listMisTurnosUseCase.execute(userId, query);
  }

  @Patch('socio/:turnoId/reprogramar')
  @Rol(RolEnum.SOCIO)
  async reprogramarTurnoSocio(
    @CurrentUserId() userId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() payload: ReprogramarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Reprogramando turno ${turnoId} para socio usuario=${userId}.`,
    );

    return this.reprogramarTurnoSocioUseCase.execute(userId, turnoId, payload);
  }

  @Patch(':turnoId/reprogramar')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.RECEPCIONISTA, RolEnum.ADMIN)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async reprogramarTurnoStaff(
    @CurrentUserId() userId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() payload: ReprogramarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Reprogramando turno ${turnoId} por staff usuario=${userId}.`,
    );

    return this.reprogramarTurnoSocioUseCase.execute(userId, turnoId, payload, {
      esStaff: true,
    });
  }

  @Patch('socio/:turnoId/cancelar')
  @Rol(RolEnum.SOCIO)
  async cancelarTurnoSocio(
    @CurrentUserId() userId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() dto: CancelarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Cancelando turno ${turnoId} para socio usuario=${userId}.`,
    );

    return this.cancelarTurnoSocioUseCase.execute(
      userId,
      turnoId,
      undefined,
      dto,
    );
  }

  @Post(':id/cancelar')
  async cancelarTurnoPorToken(
    @Param('id', ParseIntPipe) turnoId: number,
    @Query() query: ConfirmarTurnoTokenDto,
    @Body() dto: CancelarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(`Cancelando turno ${turnoId} por token.`);
    return this.cancelarTurnoSocioUseCase.execute(
      null,
      turnoId,
      query.token,
      dto,
    );
  }

  @Patch('socio/:turnoId/confirmar')
  @Rol(RolEnum.SOCIO)
  async confirmarTurnoSocio(
    @CurrentUserId() userId: number,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Confirmando turno ${turnoId} para socio usuario=${userId}.`,
    );

    return this.confirmarTurnoSocioUseCase.execute(userId, turnoId);
  }

  @Post(':id/confirmar')
  async confirmarTurnoPorToken(
    @Param('id', ParseIntPipe) turnoId: number,
    @Query() query: ConfirmarTurnoTokenDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(`Confirmando turno ${turnoId} por token.`);
    return this.confirmarTurnoSocioUseCase.execute(null, turnoId, query.token);
  }

  @Post(':id/check-in')
  @Rol(RolEnum.RECEPCIONISTA, RolEnum.ADMIN)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async checkInTurno(@Param('id', ParseIntPipe) turnoId: number): Promise<{
    success: boolean;
    estado: string;
    checkInAt: string;
    llegadaTardeMin: number | null;
    fueIdempotente: boolean;
  }> {
    this.logger.log(`Check-in para turno ${turnoId}.`);

    const result = await this.checkInTurnoUseCase.execute(turnoId);

    return {
      success: result.success,
      estado: result.estado,
      checkInAt: result.checkInAt.toISOString(),
      llegadaTardeMin: result.llegadaTardeMin,
      fueIdempotente: result.fueIdempotente,
    };
  }

  @Post(':id/revertir-checkin')
  @Rol(RolEnum.ADMIN)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async revertirCheckin(
    @Param('id', ParseIntPipe) turnoId: number,
    @Body() dto: RevertirCheckinDto,
    @CurrentUserId() userId: number,
  ): Promise<{ success: boolean; estado: string }> {
    this.logger.log(
      `Revirtiendo check-in para turno ${turnoId} por admin ${userId}. Motivo: ${dto.motivo}`,
    );

    return this.revertirCheckinTurnoUseCase.execute(
      turnoId,
      dto.motivo,
      userId,
    );
  }

  @Get('recepcion/dia')
  @Rol(RolEnum.RECEPCIONISTA, RolEnum.ADMIN)
  async getTurnosRecepcionDia(
    @Query('fecha') fecha?: string,
  ): Promise<RecepcionTurnoResponseDto[]> {
    this.logger.log(
      `Consultando turnos de recepcion para fecha ${fecha || 'hoy'}.`,
    );

    return this.getTurnosRecepcionDiaUseCase.execute(fecha);
  }

  @Post(':id/iniciar-consulta')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async iniciarConsulta(
    @Param('id', ParseIntPipe) turnoId: number,
  ): Promise<{ success: boolean; estado: string }> {
    this.logger.log(`Iniciando consulta para turno ${turnoId}.`);

    return this.iniciarConsultaUseCase.execute(turnoId);
  }

  @Post(':id/finalizar-consulta')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async finalizarConsulta(
    @Param('id', ParseIntPipe) turnoId: number,
  ): Promise<{ success: boolean; estado: string }> {
    this.logger.log(`Finalizando consulta para turno ${turnoId}.`);

    return this.finalizarConsultaUseCase.execute(turnoId);
  }

  // PR #1 — spec 17: marcar ausente manual (nutricionista dueno o RECEPCIONISTA/ADMIN del mismo gym)
  @Post('profesional/turnos/:id/marcar-ausente-manual')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.RECEPCIONISTA, RolEnum.ADMIN)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async marcarAusenteManual(
    @Param('id', ParseIntPipe) turnoId: number,
    @Body() payload: MarcarAusenteManualDto,
  ): Promise<TurnoOperacionResponseDto> {
    this.logger.log(
      `Marcando ausente manual el turno ${turnoId} por usuario ${this.tenantContext.usuarioId}.`,
    );

    return this.marcarAusenteManualUseCase.execute(turnoId, payload);
  }

  @Patch(':id/revertir-ausente')
  @Rol(RolEnum.RECEPCIONISTA, RolEnum.ADMIN, RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async revertirAusente(
    @Param('id', ParseIntPipe) turnoId: number,
    @Body() dto: RevertirAusenteDto,
    @CurrentUserId() userId: number,
  ): Promise<{ success: boolean; estadoFinal: string; hizoCheckIn: boolean }> {
    this.logger.log(
      `Revertir ausente turno ${turnoId} por usuario ${userId} (llegadaTardeMin=${dto.llegadaTardeMin ?? 'n/a'})`,
    );
    const resultado = await this.revertirAusenteTurnoUseCase.execute(
      turnoId,
      dto.motivoReversion,
      userId,
      dto.llegadaTardeMin,
    );
    return {
      success: true,
      estadoFinal: resultado.estadoFinal,
      hizoCheckIn: resultado.hizoCheckIn,
    };
  }

  @Post(':id/notificar-inasistencia')
  @Rol(RolEnum.RECEPCIONISTA, RolEnum.ADMIN)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async notificarInasistencia(
    @Param('id', ParseIntPipe) turnoId: number,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Notificando inasistencia para turno ${turnoId}`);
    await this.notificarSocioInasistenciaUseCase.execute(turnoId);
    return { success: true };
  }

  @Post('socio/:id/aviso-llegada-tarde')
  @Rol(RolEnum.SOCIO)
  async avisoLlegadaTarde(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) turnoId: number,
    @Body() dto: AvisoLlegadaTardeDto,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Socio ${userId} avisa llegada tarde para turno ${turnoId}`,
    );
    await this.avisoLlegadaTardeUseCase.execute(
      turnoId,
      dto.minutosTarde,
      userId,
    );
    return { success: true };
  }

  @Post(':id/mediciones')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async guardarMediciones(
    @Param('id', ParseIntPipe) turnoId: number,
    @Body() payload: GuardarMedicionesDto,
  ): Promise<{ success: boolean; imc: number }> {
    this.logger.log(`Guardando mediciones para turno ${turnoId}.`);

    return this.guardarMedicionesUseCase.execute(turnoId, payload);
  }

  @Post(':id/observaciones')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async guardarObservaciones(
    @Param('id', ParseIntPipe) turnoId: number,
    @Body() payload: GuardarObservacionesDto,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Guardando observaciones para turno ${turnoId}.`);

    return this.guardarObservacionesUseCase.execute(turnoId, payload);
  }

  // === ENDPOINTS DE PROGRESO ===

  @Get('profesional/:nutricionistaId/pacientes/:socioId/historial-mediciones')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard, SocioResourceAccessGuard)
  async getHistorialMedicionesPaciente(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Param('socioId', ParseIntPipe) socioId: number,
  ) {
    this.logger.log(
      `Consultando historial de mediciones. Profesional=${nutricionistaId}, socio=${socioId}.`,
    );

    return this.getHistorialMedicionesUseCase.execute(socioId);
  }

  @Get('profesional/:nutricionistaId/pacientes/:socioId/progreso')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard, SocioResourceAccessGuard)
  async getResumenProgresoPaciente(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Param('socioId', ParseIntPipe) socioId: number,
  ) {
    this.logger.log(
      `Consultando resumen de progreso. Profesional=${nutricionistaId}, socio=${socioId}.`,
    );

    return this.getResumenProgresoUseCase.execute(socioId);
  }

  @Get('socio/mi-progreso')
  @Rol(RolEnum.SOCIO)
  @UseGuards(SocioResourceAccessGuard)
  async getMiProgreso(@ResourceAccess() access: ContextoAccesoRecurso) {
    const socioId = access.socioId;

    if (socioId == null) {
      throw new ForbiddenException('No se pudo resolver el socio.');
    }

    this.logger.log(`Consultando mi progreso para socio ${socioId}.`);

    return this.getResumenProgresoUseCase.execute(socioId);
  }

  @Get('socio/mi-historial-mediciones')
  @Rol(RolEnum.SOCIO)
  @UseGuards(SocioResourceAccessGuard)
  async getMiHistorialMediciones(
    @ResourceAccess() access: ContextoAccesoRecurso,
  ) {
    const socioId = access.socioId;

    if (socioId == null) {
      throw new ForbiddenException('No se pudo resolver el socio.');
    }

    this.logger.log(
      `Consultando mi historial de mediciones para socio ${socioId}.`,
    );

    return this.getHistorialMedicionesUseCase.execute(socioId);
  }

  // === ENDPOINTS DE ADJUNTOS CLÍNICOS ===

  @Post(':id/adjuntos')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  @UseInterceptors(FileInterceptor('archivo'))
  async subirAdjunto(
    @Param('id', ParseIntPipe) turnoId: number,
    @UploadedFile() archivo: Express.Multer.File,
    @CurrentUserId() usuarioId: number,
  ) {
    this.logger.log(`Subiendo adjunto para turno ${turnoId}.`);

    return this.adjuntoClinicoService.subir({
      turnoId,
      usuarioId,
      buffer: archivo.buffer,
      nombreOriginal: archivo.originalname,
      mimeType: archivo.mimetype,
      sizeBytes: archivo.size,
    });
  }

  @Get(':id/adjuntos')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async listarAdjuntos(@Param('id', ParseIntPipe) turnoId: number) {
    this.logger.log(`Listando adjuntos para turno ${turnoId}.`);

    return this.adjuntoClinicoService.listarPorTurno(turnoId);
  }

  @Get(':id/adjuntos/:adjId/url')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async obtenerUrlAdjunto(
    @Param('id', ParseIntPipe) turnoId: number,
    @Param('adjId', ParseIntPipe) adjuntoId: number,
  ) {
    this.logger.log(`Obteniendo URL firmada para adjunto ${adjuntoId}.`);

    return {
      url: await this.adjuntoClinicoService.obtenerUrlFirmada(adjuntoId),
    };
  }

  @Delete(':id/adjuntos/:adjId')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async eliminarAdjunto(
    @Param('id', ParseIntPipe) turnoId: number,
    @Param('adjId', ParseIntPipe) adjuntoId: number,
    @CurrentUser() user: UsuarioAutenticadoPayload,
  ) {
    const esAdmin = user.rol === RolEnum.ADMIN;
    this.logger.log(`Eliminando adjunto ${adjuntoId} del turno ${turnoId}.`);

    await this.adjuntoClinicoService.eliminar(adjuntoId, user.id, esAdmin);
    return { success: true };
  }
}
