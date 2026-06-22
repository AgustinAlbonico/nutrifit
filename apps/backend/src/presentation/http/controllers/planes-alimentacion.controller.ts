import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  CrearPlanAlimentacionDto,
  EditarPlanAlimentacionDto,
  EliminarPlanAlimentacionDto,
  PlanAlimentacionResponseDto,
} from 'src/application/planes-alimentacion/dtos';
import {
  CrearPlanAlimentacionUseCase,
  EditarPlanAlimentacionUseCase,
  EliminarPlanAlimentacionUseCase,
  EliminarPlanAlimentacionResponseDto,
  ListarPlanesSocioUseCase,
  ListarPlanesNutricionistaUseCase,
  ObtenerPlanActivoSocioUseCase,
  ObtenerPlanPorIdUseCase,
  VaciarContenidoPlanUseCase,
  VaciarContenidoPlanResponseDto,
} from 'src/application/planes-alimentacion/use-cases';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { CurrentUserId } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { NutricionistaOwnershipGuard } from 'src/infrastructure/auth/guards/nutricionista-ownership.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { SocioResourceAccessGuard } from 'src/infrastructure/auth/guards/socio-resource-access.guard';

@Controller('planes-alimentacion')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class PlanAlimentacionController {
  constructor(
    private readonly crearPlanAlimentacionUseCase: CrearPlanAlimentacionUseCase,
    private readonly editarPlanAlimentacionUseCase: EditarPlanAlimentacionUseCase,
    private readonly eliminarPlanAlimentacionUseCase: EliminarPlanAlimentacionUseCase,
    private readonly obtenerPlanActivoSocioUseCase: ObtenerPlanActivoSocioUseCase,
    private readonly obtenerPlanPorIdUseCase: ObtenerPlanPorIdUseCase,
    private readonly listarPlanesSocioUseCase: ListarPlanesSocioUseCase,
    private readonly listarPlanesNutricionistaUseCase: ListarPlanesNutricionistaUseCase,
    private readonly vaciarContenidoPlanUseCase: VaciarContenidoPlanUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  @Post()
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @UseGuards(SocioResourceAccessGuard)
  async crearPlan(
    @CurrentUserId() nutricionistaUserId: number,
    @Body() payload: CrearPlanAlimentacionDto,
  ): Promise<PlanAlimentacionResponseDto> {
    this.logger.log(
      `Creando plan de alimentación para socio ${payload.socioId} por nutricionista ${nutricionistaUserId}.`,
    );
    return this.crearPlanAlimentacionUseCase.execute(
      nutricionistaUserId,
      payload,
    );
  }

  @Get('nutricionista/:nutricionistaId')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @UseGuards(NutricionistaOwnershipGuard)
  async listarPlanesNutricionista(
    @Param('nutricionistaId', ParseIntPipe) nutricionistaId: number,
  ): Promise<PlanAlimentacionResponseDto[]> {
    this.logger.log(
      `Listando planes de alimentación del nutricionista ${nutricionistaId}.`,
    );
    return this.listarPlanesNutricionistaUseCase.execute(nutricionistaId);
  }

  @Get('socio/:socioId/activo')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SOCIO)
  @UseGuards(SocioResourceAccessGuard)
  async obtenerPlanActivoSocio(
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<PlanAlimentacionResponseDto | null> {
    this.logger.log(`Consultando plan activo del socio ${socioId}.`);
    return this.obtenerPlanActivoSocioUseCase.execute(socioId);
  }

  @Get('socio/:socioId')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SOCIO)
  @UseGuards(SocioResourceAccessGuard)
  async listarPlanesSocio(
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<PlanAlimentacionResponseDto[]> {
    this.logger.log(`Listando planes de alimentación del socio ${socioId}.`);
    return this.listarPlanesSocioUseCase.execute(socioId);
  }

  @Get(':id')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SOCIO)
  @UseGuards(SocioResourceAccessGuard)
  async obtenerPlanPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlanAlimentacionResponseDto> {
    this.logger.log(`Consultando plan de alimentación ${id}.`);
    return this.obtenerPlanPorIdUseCase.execute(id);
  }

  @Put(':id')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @UseGuards(SocioResourceAccessGuard)
  async editarPlan(
    @CurrentUserId() nutricionistaUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: EditarPlanAlimentacionDto,
  ): Promise<PlanAlimentacionResponseDto> {
    this.logger.log(
      `Editando plan de alimentación ${id} por nutricionista ${nutricionistaUserId}.`,
    );
    return this.editarPlanAlimentacionUseCase.execute(nutricionistaUserId, {
      ...payload,
      planId: id,
    });
  }

  @Delete(':id')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @UseGuards(SocioResourceAccessGuard)
  async eliminarPlan(
    @CurrentUserId() nutricionistaUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: EliminarPlanAlimentacionDto,
  ): Promise<EliminarPlanAlimentacionResponseDto> {
    this.logger.log(
      `Eliminando plan de alimentación ${id} por nutricionista ${nutricionistaUserId}.`,
    );
    return this.eliminarPlanAlimentacionUseCase.execute(nutricionistaUserId, {
      ...payload,
      planId: id,
    });
  }

  @Delete(':id/contenido')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @UseGuards(SocioResourceAccessGuard)
  async vaciarContenidoPlan(
    @CurrentUserId() nutricionistaUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VaciarContenidoPlanResponseDto> {
    this.logger.log(
      `Vaciando contenido del plan ${id} por nutricionista ${nutricionistaUserId}.`,
    );
    return this.vaciarContenidoPlanUseCase.execute(nutricionistaUserId, {
      planId: id,
    });
  }
}
