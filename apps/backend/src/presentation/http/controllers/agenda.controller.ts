import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AgendaResponseDto,
  ConfigureAgendaDto,
  ConfigureAgendaResponseDto,
  CrearExcepcionDisponibilidadDto,
  ExcepcionDisponibilidadResponseDto,
  ListarExcepcionesDisponibilidadQueryDto,
} from 'src/application/agenda/dtos';
import {
  ConfigureAgendaUseCase,
  CrearExcepcionDisponibilidadUseCase,
  GetAgendaUseCase,
  ListarExcepcionesDisponibilidadUseCase,
} from 'src/application/agenda/use-cases';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { NutricionistaOwnershipGuard } from 'src/infrastructure/auth/guards/nutricionista-ownership.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class AgendaController {
  constructor(
    private readonly configureAgendaUseCase: ConfigureAgendaUseCase,
    private readonly getAgendaUseCase: GetAgendaUseCase,
    private readonly crearExcepcionDisponibilidadUseCase: CrearExcepcionDisponibilidadUseCase,
    private readonly listarExcepcionesDisponibilidadUseCase: ListarExcepcionesDisponibilidadUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  @Put('agenda/:nutricionistaId/configuracion')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async configureAgendaLegacy(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Body() configureAgendaDto: ConfigureAgendaDto,
  ): Promise<ConfigureAgendaResponseDto> {
    return this.configureAgendaInterna(nutricionistaId, configureAgendaDto);
  }

  @Put('nutricionistas/:nutricionistaId/disponibilidad')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async configureAgenda(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Body() configureAgendaDto: ConfigureAgendaDto,
  ): Promise<ConfigureAgendaResponseDto> {
    return this.configureAgendaInterna(nutricionistaId, configureAgendaDto);
  }

  @Get('agenda/:nutricionistaId')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async getAgendaByNutricionistaLegacy(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
  ): Promise<AgendaResponseDto[]> {
    return this.getAgendaInterna(nutricionistaId);
  }

  @Get('nutricionistas/:nutricionistaId/disponibilidad')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async getAgendaByNutricionista(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
  ): Promise<AgendaResponseDto[]> {
    return this.getAgendaInterna(nutricionistaId);
  }

  @Get('agenda/:nutricionistaId/excepciones-disponibilidad')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async listarExcepcionesDisponibilidadLegacy(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Query() query: ListarExcepcionesDisponibilidadQueryDto,
  ): Promise<ExcepcionDisponibilidadResponseDto[]> {
    return this.listarExcepcionesDisponibilidadInterna(nutricionistaId, query);
  }

  @Get('nutricionistas/:nutricionistaId/excepciones-disponibilidad')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async listarExcepcionesDisponibilidad(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Query() query: ListarExcepcionesDisponibilidadQueryDto,
  ): Promise<ExcepcionDisponibilidadResponseDto[]> {
    return this.listarExcepcionesDisponibilidadInterna(nutricionistaId, query);
  }

  @Post('agenda/:nutricionistaId/excepciones-disponibilidad')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async crearExcepcionDisponibilidadLegacy(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Body() payload: CrearExcepcionDisponibilidadDto,
  ): Promise<ExcepcionDisponibilidadResponseDto> {
    return this.crearExcepcionDisponibilidadInterna(nutricionistaId, payload);
  }

  @Post('nutricionistas/:nutricionistaId/excepciones-disponibilidad')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async crearExcepcionDisponibilidad(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Body() payload: CrearExcepcionDisponibilidadDto,
  ): Promise<ExcepcionDisponibilidadResponseDto> {
    return this.crearExcepcionDisponibilidadInterna(nutricionistaId, payload);
  }

  private async configureAgendaInterna(
    nutricionistaId: number,
    configureAgendaDto: ConfigureAgendaDto,
  ): Promise<ConfigureAgendaResponseDto> {
    this.logger.log(
      `Configurando agenda para profesional ${nutricionistaId} con ${configureAgendaDto.agendas.length} bloques.`,
    );

    return this.configureAgendaUseCase.execute(
      nutricionistaId,
      configureAgendaDto,
    );
  }

  private async getAgendaInterna(
    nutricionistaId: number,
  ): Promise<AgendaResponseDto[]> {
    this.logger.log(`Consultando agenda del profesional ${nutricionistaId}.`);

    const agenda = await this.getAgendaUseCase.execute(nutricionistaId);

    return agenda.map((item) => this.toResponseDto(item));
  }

  private async listarExcepcionesDisponibilidadInterna(
    nutricionistaId: number,
    query: ListarExcepcionesDisponibilidadQueryDto,
  ): Promise<ExcepcionDisponibilidadResponseDto[]> {
    this.logger.log(
      `Listando excepciones de disponibilidad del profesional ${nutricionistaId}.`,
    );
    return this.listarExcepcionesDisponibilidadUseCase.execute(
      nutricionistaId,
      query,
    );
  }

  private async crearExcepcionDisponibilidadInterna(
    nutricionistaId: number,
    payload: CrearExcepcionDisponibilidadDto,
  ): Promise<ExcepcionDisponibilidadResponseDto> {
    this.logger.log(
      `Creando excepcion de disponibilidad para profesional ${nutricionistaId}.`,
    );
    return this.crearExcepcionDisponibilidadUseCase.execute(
      nutricionistaId,
      payload,
    );
  }

  private toResponseDto(agenda: AgendaEntity): AgendaResponseDto {
    const response = new AgendaResponseDto();
    response.idAgenda = agenda.idAgenda ?? 0;
    response.dia = agenda.dia;
    response.horaInicio = agenda.horaInicio;
    response.horaFin = agenda.horaFin;
    response.duracionTurno = agenda.duracionTurno;
    return response;
  }
}
