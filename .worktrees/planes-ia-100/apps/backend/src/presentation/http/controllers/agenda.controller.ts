import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  AgendaResponseDto,
  ConfigureAgendaDto,
} from 'src/application/agenda/dtos';
import {
  ConfigureAgendaUseCase,
  GetAgendaUseCase,
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

@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class AgendaController {
  constructor(
    private readonly configureAgendaUseCase: ConfigureAgendaUseCase,
    private readonly getAgendaUseCase: GetAgendaUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  @Put(':nutricionistaId/configuracion')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async configureAgenda(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
    @Body() configureAgendaDto: ConfigureAgendaDto,
  ): Promise<AgendaResponseDto[]> {
    this.logger.log(
      `Configurando agenda para profesional ${nutricionistaId} con ${configureAgendaDto.agendas.length} bloques.`,
    );

    const configuredAgenda = await this.configureAgendaUseCase.execute(
      nutricionistaId,
      configureAgendaDto,
    );

    return configuredAgenda.map((agenda) => this.toResponseDto(agenda));
  }

  @Get(':nutricionistaId')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(NutricionistaOwnershipGuard)
  async getAgendaByNutricionista(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
  ): Promise<AgendaResponseDto[]> {
    this.logger.log(`Consultando agenda del profesional ${nutricionistaId}.`);

    const agenda = await this.getAgendaUseCase.execute(nutricionistaId);

    return agenda.map((item) => this.toResponseDto(item));
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
