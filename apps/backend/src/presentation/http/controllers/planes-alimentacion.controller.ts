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
import { IsInt, Min } from 'class-validator';
import {
  CrearFeedbackPlanDto,
  CrearPlanAlimentacionDto,
  EditarPlanAlimentacionDto,
  EliminarPlanAlimentacionDto,
  PlanAlimentacionResponseDto,
} from 'src/application/planes-alimentacion/dtos';

import {
  CrearPlanAlimentacionUseCase,
  CrearPlanManualVacioUseCase,
  EditarPlanAlimentacionUseCase,
  EliminarPlanAlimentacionUseCase,
  EliminarPlanAlimentacionResponseDto,
  ListarPlanesSocioUseCase,
  ListarPlanesNutricionistaUseCase,
  ListarPlanesActivosSocioUseCase,
  type PlanSocioActivoDTO,
  ObtenerPlanPorIdUseCase,
  VaciarContenidoPlanUseCase,
  VaciarContenidoPlanResponseDto,
  ListarVersionesPlanUseCase,
  ObtenerVersionPlanUseCase,
  CrearFeedbackPlanUseCase,
  type CrearPlanManualVacioResponseDto,
  EditarFeedbackPlanUseCase,
  ActivarPlanAlimentacionUseCase,
  FinalizarPlanAlimentacionUseCase,
  PersistirPlanManualUseCase,
  GuardarVersionPlanUseCase,
} from 'src/application/planes-alimentacion/use-cases';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  CurrentUser,
  CurrentUserId,
} from 'src/infrastructure/auth/decorators/current-user.decorator';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { NutricionistaOwnershipGuard } from 'src/infrastructure/auth/guards/nutricionista-ownership.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { SocioResourceAccessGuard } from 'src/infrastructure/auth/guards/socio-resource-access.guard';
import {
  PLAN_FEEDBACK_REPOSITORY,
  PlanFeedbackRepository,
} from 'src/domain/repositories/plan-feedback.repository';
import { ACCIONES } from '@nutrifit/shared';

export class ActivarPlanHttpDTO {
  @IsInt()
  @Min(1)
  versionId!: number;
}

@Controller('planes-alimentacion')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class PlanAlimentacionController {
  constructor(
    private readonly crearPlanAlimentacionUseCase: CrearPlanAlimentacionUseCase,
    private readonly crearPlanManualVacioUseCase: CrearPlanManualVacioUseCase,
    private readonly editarPlanAlimentacionUseCase: EditarPlanAlimentacionUseCase,
    private readonly eliminarPlanAlimentacionUseCase: EliminarPlanAlimentacionUseCase,
    // Hotfix Packet 8: el endpoint /socio/:id/activo ahora devuelve
    // N planes activos (uno por nutricionista), no 1. La respuesta es
    // SIEMPRE un array (vacío si no hay planes activos).
    private readonly listarPlanesActivosSocioUseCase: ListarPlanesActivosSocioUseCase,
    private readonly obtenerPlanPorIdUseCase: ObtenerPlanPorIdUseCase,
    private readonly listarPlanesSocioUseCase: ListarPlanesSocioUseCase,
    private readonly listarPlanesNutricionistaUseCase: ListarPlanesNutricionistaUseCase,
    private readonly vaciarContenidoPlanUseCase: VaciarContenidoPlanUseCase,
    private readonly listarVersionesPlanUseCase: ListarVersionesPlanUseCase,
    private readonly obtenerVersionPlanUseCase: ObtenerVersionPlanUseCase,
    private readonly crearFeedbackPlanUseCase: CrearFeedbackPlanUseCase,
    private readonly editarFeedbackPlanUseCase: EditarFeedbackPlanUseCase,
    private readonly activarPlanAlimentacionUseCase: ActivarPlanAlimentacionUseCase,
    private readonly finalizarPlanAlimentacionUseCase: FinalizarPlanAlimentacionUseCase,
    private readonly persistirPlanManualUseCase: PersistirPlanManualUseCase,
    private readonly guardarVersionPlanUseCase: GuardarVersionPlanUseCase,
    @Inject(PLAN_FEEDBACK_REPOSITORY)
    private readonly feedbackRepo: PlanFeedbackRepository,
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

  @Post('crear-manual/:socioId')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  async crearPlanManual(
    @CurrentUserId() nutricionistaUserId: number,
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<CrearPlanManualVacioResponseDto> {
    this.logger.log(
      `Creando plan manual vacío para socio ${socioId} por nutricionista ${nutricionistaUserId}.`,
    );
    return this.crearPlanManualVacioUseCase.execute(
      nutricionistaUserId,
      socioId,
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
  async listarPlanesActivosSocio(
    @Param('socioId', ParseIntPipe) socioId: number,
  ): Promise<PlanSocioActivoDTO[]> {
    this.logger.log(`Consultando planes activos del socio ${socioId}.`);
    // Hotfix Packet 8: la respuesta ahora es SIEMPRE un array
    // (PlanSocioActivoDTO[]), uno por nutricionista con plan ACTIVO.
    return this.listarPlanesActivosSocioUseCase.execute(socioId);
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

  // ========================================================================
  // ENDPOINTS DE VERSIONADO + FEEDBACK (Packet 3, plan-alimentacion-ia-v2)
  // ========================================================================

  @Get(':id/versiones')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SUPERADMIN, RolEnum.SOCIO)
  @Actions(ACCIONES.PLANES_VER)
  async listarVersiones(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ): Promise<unknown[]> {
    this.logger.log(`Listando versiones del plan ${id}.`);
    return this.listarVersionesPlanUseCase.execute({
      planAlimentacionId: id,
      user: {
        id: user.id,
        rol: user.rol,
        personaId: user.personaId,
        gimnasioId: user.gimnasioId,
      },
    });
  }

  @Get('version/:versionId')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SUPERADMIN, RolEnum.SOCIO)
  @Actions(ACCIONES.PLANES_VER)
  async obtenerVersion(
    @Param('versionId', ParseIntPipe) versionId: number,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ): Promise<unknown> {
    this.logger.log(`Obteniendo versión ${versionId} del plan.`);
    return this.obtenerVersionPlanUseCase.execute({
      versionId,
      user: {
        id: user.id,
        rol: user.rol,
        personaId: user.personaId,
        gimnasioId: user.gimnasioId,
      },
    });
  }

  @Post('version/:versionId/feedback')
  @Rol(RolEnum.NUTRICIONISTA)
  @Actions('PLANES_IA_FEEDBACK')
  async crearFeedback(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body() payload: CrearFeedbackPlanDto,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ): Promise<unknown> {
    this.logger.log(
      `Creando feedback para versión ${versionId} por usuario ${user.id}.`,
    );
    return this.crearFeedbackPlanUseCase.execute({
      versionId,
      voto: payload.voto,
      comentario: payload.comentario ?? null,
      user: {
        id: user.id,
        rol: user.rol,
        personaId: user.personaId,
        gimnasioId: user.gimnasioId,
      },
    });
  }

  @Put('version/:versionId/feedback')
  @Rol(RolEnum.NUTRICIONISTA)
  @Actions('PLANES_IA_FEEDBACK')
  async editarFeedback(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body() payload: CrearFeedbackPlanDto,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ): Promise<unknown> {
    this.logger.log(
      `Editando feedback de versión ${versionId} por usuario ${user.id}.`,
    );
    // PUT por versionId: resolver feedbackId via repo, luego delegar.
    const feedback = await this.feedbackRepo.obtenerPorVersion(versionId);
    if (!feedback) {
      throw new NotFoundError('Feedback de plan', `para versión ${versionId}`);
    }
    return this.editarFeedbackPlanUseCase.execute({
      feedbackId: feedback.idPlanFeedback,
      voto: payload.voto,
      comentario: payload.comentario ?? null,
      user: {
        id: user.id,
        rol: user.rol,
        personaId: user.personaId,
        gimnasioId: user.gimnasioId,
      },
    });
  }

  // ========================================================================
  // ENDPOINTS DE ACTIVAR / FINALIZAR (Packet 4, plan-alimentacion-ia-v2)
  // Máquina de estados del plan: BORRADOR → ACTIVO → FINALIZADO.
  // ========================================================================

  @Post(':id/activar')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SUPERADMIN)
  @Actions('PLANES_ACTIVAR')
  @UseGuards(SocioResourceAccessGuard)
  async activarPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ActivarPlanHttpDTO,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ): Promise<{
    planAlimentacionId: number;
    versionActivaId: number;
    estado: 'ACTIVO';
  }> {
    this.logger.log(
      `Activando versión ${payload.versionId} del plan ${id} por nutricionista ${user.personaId}.`,
    );
    const result = await this.activarPlanAlimentacionUseCase.execute({
      planAlimentacionId: id,
      versionId: payload.versionId,
      nutricionistaUserId: user.personaId ?? 0,
      gimnasioId: user.gimnasioId ?? 0,
    });
    return result;
  }

  @Post(':id/finalizar')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SUPERADMIN)
  @Actions('PLANES_FINALIZAR')
  @UseGuards(SocioResourceAccessGuard)
  async finalizarPlan(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ): Promise<{
    planAlimentacionId: number;
    estado: 'FINALIZADO';
    finalizadoAt: Date;
  }> {
    this.logger.log(
      `Finalizando plan ${id} por nutricionista ${user.personaId}.`,
    );
    return this.finalizarPlanAlimentacionUseCase.execute({
      planAlimentacionId: id,
      nutricionistaUserId: user.personaId ?? 0,
      gimnasioId: user.gimnasioId ?? 0,
    });
  }

  @Post(':id/persistir-manual')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @Actions(ACCIONES.PLANES_PERSISTIR_MANUAL)
  async persistirManual(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
    @Body() body: { dias: unknown[]; notas?: string },
  ) {
    return this.persistirPlanManualUseCase.execute(
      user.personaId ?? 0,
      user.rol as string,
      id,
      body as never,
    );
  }

  @Post(':id/guardar-version')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @Actions(ACCIONES.PLANES_ACTIVAR)
  async guardarVersion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ) {
    this.logger.log(
      `Guardando versión del plan ${id} por nutricionista ${user.personaId}.`,
    );
    return this.guardarVersionPlanUseCase.execute({
      planAlimentacionId: id,
      nutricionistaUserId: user.personaId ?? 0,
      gimnasioId: user.gimnasioId ?? 0,
    });
  }
}
