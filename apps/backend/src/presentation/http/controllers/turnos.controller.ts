import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AgendaSlotDto,
  AsignarTurnoManualDto,
  BloquearTurnoDto,
  CancelarTurnoSocioDto,
  DatosTurnoResponseDto,
  FichaSaludPacienteResponseDto,
  FichaSaludSocioResponseDto,
  GetTurnosDelDiaQueryDto,
  GetAgendaDiariaQueryDto,
  GuardarMedicionesDto,
  GuardarObservacionesDto,
  HistorialConsultaPacienteResponseDto,
  ListMisTurnosQueryDto,
  ListPacientesProfesionalQueryDto,
  MiTurnoResponseDto,
  PacienteProfesionalResponseDto,
  RecepcionTurnoResponseDto,
  ReprogramarTurnoSocioDto,
  ConfirmarTurnoTokenDto,
  RegistrarAsistenciaTurnoDto,
  ReservarTurnoSocioDto,
  TurnoDelDiaResponseDto,
  TurnoOperacionResponseDto,
  UpsertFichaSaludSocioDto,
} from 'src/application/turnos/dtos';
import {
  AsignarTurnoManualUseCase,
  BloquearTurnoUseCase,
  CancelarTurnoSocioUseCase,
  CheckInTurnoUseCase,
  ConfirmarTurnoSocioUseCase,
  DesbloquearTurnoUseCase,
  FinalizarConsultaUseCase,
  GetAgendaDiariaUseCase,
  GetFichaSaludPacienteUseCase,
  GetFichaSaludSocioUseCase,
  GetHistorialConsultasPacienteUseCase,
  GetTurnoByIdUseCase,
  GetTurnosDelDiaUseCase,
  GetTurnosRecepcionDiaUseCase,
  GetHistorialMedicionesUseCase,
  GetResumenProgresoUseCase,
  GuardarMedicionesUseCase,
  GuardarObservacionesUseCase,
  IniciarConsultaUseCase,
  ListMisTurnosUseCase,
  ListPacientesProfesionalUseCase,
  ReprogramarTurnoSocioUseCase,
  RegistrarAsistenciaTurnoUseCase,
  ReservarTurnoSocioUseCase,
  UpsertFichaSaludSocioUseCase,
} from 'src/application/turnos/use-cases';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { NutricionistaOwnershipGuard } from 'src/infrastructure/auth/guards/nutricionista-ownership.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { SocioResourceAccessGuard } from 'src/infrastructure/auth/guards/socio-resource-access.guard';
import { TurnoNutricionistaAccessGuard } from 'src/infrastructure/auth/guards/turno-nutricionista-access.guard';
import { Request } from 'express';

@Controller('turnos')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class TurnosController {
  constructor(
    private readonly getTurnosDelDiaUseCase: GetTurnosDelDiaUseCase,
    private readonly getAgendaDiariaUseCase: GetAgendaDiariaUseCase,
    private readonly getTurnosRecepcionDiaUseCase: GetTurnosRecepcionDiaUseCase,
    private readonly asignarTurnoManualUseCase: AsignarTurnoManualUseCase,
    private readonly bloquearTurnoUseCase: BloquearTurnoUseCase,
    private readonly desbloquearTurnoUseCase: DesbloquearTurnoUseCase,
    private readonly cancelarTurnoSocioUseCase: CancelarTurnoSocioUseCase,
    private readonly checkInTurnoUseCase: CheckInTurnoUseCase,
    private readonly confirmarTurnoSocioUseCase: ConfirmarTurnoSocioUseCase,
    private readonly finalizarConsultaUseCase: FinalizarConsultaUseCase,
    private readonly getFichaSaludPacienteUseCase: GetFichaSaludPacienteUseCase,
    private readonly getFichaSaludSocioUseCase: GetFichaSaludSocioUseCase,
    private readonly getHistorialConsultasPacienteUseCase: GetHistorialConsultasPacienteUseCase,
    private readonly getHistorialMedicionesUseCase: GetHistorialMedicionesUseCase,
    private readonly getResumenProgresoUseCase: GetResumenProgresoUseCase,
    private readonly getTurnoByIdUseCase: GetTurnoByIdUseCase,
    private readonly guardarMedicionesUseCase: GuardarMedicionesUseCase,
    private readonly guardarObservacionesUseCase: GuardarObservacionesUseCase,
    private readonly iniciarConsultaUseCase: IniciarConsultaUseCase,
    private readonly listMisTurnosUseCase: ListMisTurnosUseCase,
    private readonly listPacientesProfesionalUseCase: ListPacientesProfesionalUseCase,
    private readonly reprogramarTurnoSocioUseCase: ReprogramarTurnoSocioUseCase,
    private readonly registrarAsistenciaTurnoUseCase: RegistrarAsistenciaTurnoUseCase,
    private readonly reservarTurnoSocioUseCase: ReservarTurnoSocioUseCase,
    private readonly upsertFichaSaludSocioUseCase: UpsertFichaSaludSocioUseCase,
    private readonly adjuntoClinicoService: any, // AdjuntoClinicoService injected
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

  @Get(':id')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async getTurnoById(
    @Param('id', ParseIntPipe) turnoId: number,
    @Req() req: Request,
  ): Promise<DatosTurnoResponseDto> {
    const nutricionistaId = (req as any).resourceAccess?.actorPersonaId;

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
    @Req() req: Request,
    @Body() payload: UpsertFichaSaludSocioDto,
  ): Promise<FichaSaludSocioResponseDto> {
    const userId = (req as any).user?.id;

    this.logger.log(
      `Actualizando ficha de salud para socio usuario=${userId}.`,
    );

    return this.upsertFichaSaludSocioUseCase.execute(userId, payload);
  }

  @Get('socio/ficha-salud')
  @Rol(RolEnum.SOCIO)
  async getFichaSaludSocio(
    @Req() req: Request,
  ): Promise<FichaSaludSocioResponseDto | null> {
    const userId = (req as any).user?.id;

    this.logger.log(`Consultando ficha de salud para socio usuario=${userId}.`);

    return this.getFichaSaludSocioUseCase.execute(userId);
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
  @Rol(RolEnum.ADMIN)
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
    @Req() req: Request,
    @Body() payload: ReservarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    const userId = (req as any).user?.id;

    this.logger.log(`Reservando turno para socio usuario=${userId}.`);

    return this.reservarTurnoSocioUseCase.execute(userId, payload);
  }

  @Get('socio/mis-turnos')
  @Rol(RolEnum.SOCIO)
  async listMisTurnos(
    @Req() req: Request,
    @Query() query: ListMisTurnosQueryDto,
  ): Promise<MiTurnoResponseDto[]> {
    const userId = (req as any).user?.id;

    this.logger.log(`Consultando mis turnos para socio usuario=${userId}.`);

    return this.listMisTurnosUseCase.execute(userId, query);
  }

  @Patch('socio/:turnoId/reprogramar')
  @Rol(RolEnum.SOCIO)
  async reprogramarTurnoSocio(
    @Req() req: Request,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() payload: ReprogramarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    const userId = (req as any).user?.id;

    this.logger.log(
      `Reprogramando turno ${turnoId} para socio usuario=${userId}.`,
    );

    return this.reprogramarTurnoSocioUseCase.execute(userId, turnoId, payload);
  }

  @Patch('socio/:turnoId/cancelar')
  @Rol(RolEnum.SOCIO)
  async cancelarTurnoSocio(
    @Req() req: Request,
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body() dto: CancelarTurnoSocioDto,
  ): Promise<TurnoOperacionResponseDto> {
    const userId = (req as any).user?.id;

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
    @Req() req: Request,
    @Param('turnoId', ParseIntPipe) turnoId: number,
  ): Promise<TurnoOperacionResponseDto> {
    const userId = (req as any).user?.id;

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
  @Rol(RolEnum.RECEPCIONISTA)
  async checkInTurno(
    @Param('id', ParseIntPipe) turnoId: number,
  ): Promise<{ success: boolean; estado: string }> {
    this.logger.log(`Check-in para turno ${turnoId}.`);

    return this.checkInTurnoUseCase.execute(turnoId);
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
  async getMiProgreso(@Req() req: Request) {
    const socioId = (req as any).resourceAccess?.socioId;

    this.logger.log(`Consultando mi progreso para socio ${socioId}.`);

    return this.getResumenProgresoUseCase.execute(socioId);
  }

  @Get('socio/mi-historial-mediciones')
  @Rol(RolEnum.SOCIO)
  @UseGuards(SocioResourceAccessGuard)
  async getMiHistorialMediciones(@Req() req: Request) {
    const socioId = (req as any).resourceAccess?.socioId;

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
    @Req() req: Request,
  ) {
    const usuarioId = (req as any).user?.id;
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
    @Req() req: Request,
  ) {
    const usuarioId = (req as any).user?.id;
    const esAdmin = (req as any).user?.rol === RolEnum.ADMIN;
    this.logger.log(`Eliminando adjunto ${adjuntoId} del turno ${turnoId}.`);

    await this.adjuntoClinicoService.eliminar(adjuntoId, usuarioId, esAdmin);
    return { success: true };
  }
}
