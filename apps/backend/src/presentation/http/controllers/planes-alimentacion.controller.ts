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
  Req,
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
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { PlanSocioAccessGuard } from 'src/infrastructure/auth/guards/plan-socio-access.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Request } from 'express';

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
  @UseGuards(PlanSocioAccessGuard)
  async crearPlan(
    @Req() req: Request,
    @Body() payload: CrearPlanAlimentacionDto,
  ): Promise<PlanAlimentacionResponseDto> {
    const nutricionistaUserId = (req as any).user?.id;
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
  @UseGuards(PlanSocioAccessGuard)
  async obtenerPlanActivoSocio(
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<PlanAlimentacionResponseDto> {
    this.logger.log(`Consultando plan activo del socio ${socioId}.`);
    return this.obtenerPlanActivoSocioUseCase.execute(socioId);
  }

  @Get('socio/:socioId')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SOCIO)
  @UseGuards(PlanSocioAccessGuard)
  async listarPlanesSocio(
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<PlanAlimentacionResponseDto[]> {
    this.logger.log(`Listando planes de alimentación del socio ${socioId}.`);
    return this.listarPlanesSocioUseCase.execute(socioId);
  }

  @Get(':id')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SOCIO)
  @UseGuards(PlanSocioAccessGuard)
  async obtenerPlanPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlanAlimentacionResponseDto> {
    this.logger.log(`Consultando plan de alimentación ${id}.`);
    return this.obtenerPlanPorIdUseCase.execute(id);
  }

  @Put(':id')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @UseGuards(PlanSocioAccessGuard)
  async editarPlan(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: EditarPlanAlimentacionDto,
  ): Promise<PlanAlimentacionResponseDto> {
    const nutricionistaUserId = (req as any).user?.id;
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
  @UseGuards(PlanSocioAccessGuard)
  async eliminarPlan(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: EliminarPlanAlimentacionDto,
  ): Promise<EliminarPlanAlimentacionResponseDto> {
    const nutricionistaUserId = (req as any).user?.id;
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
  @UseGuards(PlanSocioAccessGuard)
  async vaciarContenidoPlan(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VaciarContenidoPlanResponseDto> {
    const nutricionistaUserId = (req as any).user?.id;
    this.logger.log(
      `Vaciando contenido del plan ${id} por nutricionista ${nutricionistaUserId}.`,
    );
    return this.vaciarContenidoPlanUseCase.execute(nutricionistaUserId, {
      planId: id,
    });
  }
}
