import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  GenerarRecomendacionDto,
  SugerirSustitucionDto,
  AnalizarPlanDto,
} from 'src/application/ai/dto';
import { SolicitudPlanSemanalHttpDTO } from 'src/application/ai/dtos/solicitud-plan-semanal.dto';
import { SolicitudRegeneracionHttpDTO } from 'src/application/ai/dtos/solicitud-regeneracion.dto';
import { GenerarIdeasComidaInputDto } from 'src/application/ai/dto/generar-ideas-comida.dto';
import {
  GenerarRecomendacionComidaUseCase,
  GenerarPlanSemanalUseCase,
  RegenerarPlanSemanalUseCase,
  SugerirSustitucionUseCase,
  AnalizarPlanNutricionalUseCase,
  GenerarIdeasComidaUseCase,
} from 'src/application/ai/use-cases';
import type { RespuestaPlanSemanal } from 'src/application/ai/use-cases/generar-plan-semanal.use-case';
import type { RespuestaRegenerarPlan } from 'src/application/ai/use-cases/regenerar-plan-semanal.use-case';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { CurrentUser } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { ACCIONES } from '@nutrifit/shared';

@ApiTags('IA - Recomendaciones Nutricionales')
@ApiBearerAuth()
@Controller('ia')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class AiController {
  constructor(
    private readonly generarRecomendacionUseCase: GenerarRecomendacionComidaUseCase,
    private readonly generarPlanSemanalUseCase: GenerarPlanSemanalUseCase,
    private readonly regenerarPlanSemanalUseCase: RegenerarPlanSemanalUseCase,
    private readonly sugerirSustitucionUseCase: SugerirSustitucionUseCase,
    private readonly analizarPlanNutricionalUseCase: AnalizarPlanNutricionalUseCase,
    private readonly generarIdeasComidaUseCase: GenerarIdeasComidaUseCase,
  ) {}

  @Post('recomendacion')
  @Rol(RolEnum.NUTRICIONISTA)
  @ApiOperation({ summary: 'Generar recomendación de comida con IA' })
  @ApiResponse({
    status: 201,
    description: 'Recomendación generada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o alérgenos detectados',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async generarRecomendacion(@Body() dto: GenerarRecomendacionDto) {
    return this.generarRecomendacionUseCase.execute({
      socioId: dto.socioId,
      tipoComida: dto.tipoComida,
      preferenciasAdicionales: dto.preferenciasAdicionales,
    });
  }

  @Post('plan-semanal')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SUPERADMIN)
  @Actions(ACCIONES.PLANES_IA_GENERAR)
  @ApiOperation({ summary: 'Generar plan semanal con IA v2' })
  @ApiResponse({
    status: 201,
    description: 'Plan semanal generado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, estructura inválida o violación de validación',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async generarPlanSemanal(
    @Body() dto: SolicitudPlanSemanalHttpDTO,
    @CurrentUser() user: { personaId: number; gimnasioId: number },
  ): Promise<RespuestaPlanSemanal> {
    return this.generarPlanSemanalUseCase.execute({
      socioId: dto.socioId,
      nutricionistaId: user.personaId,
      gimnasioId: user.gimnasioId,
      diasAGenerar: dto.diasAGenerar,
      comidasPorDia: dto.comidasPorDia,
      alternativasPorComida: dto.alternativasPorComida,
      notasGeneracion: dto.notasGeneracion,
      fechaInicio: dto.fechaInicio,
      caloriasLimite: dto.caloriasLimite,
      proteinasEstimadas: dto.proteinasEstimadas,
      carbohidratosEstimados: dto.carbohidratosEstimados,
      grasasEstimados: dto.grasasEstimados,
    });
  }

  @Post('plan-semanal/regenerar')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SUPERADMIN)
  @Actions(ACCIONES.PLANES_IA_REGENERAR)
  @ApiOperation({
    summary:
      'Regenerar parte de un plan semanal con IA (PLAN/DIA/ALTERNATIVA)',
  })
  @ApiResponse({
    status: 201,
    description: 'Nueva versión del plan creada con merge quirúrgico',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o scope incorrecto',
  })
  @ApiResponse({ status: 403, description: 'No es dueño del plan' })
  @ApiResponse({ status: 404, description: 'Plan o versión no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Plan finalizado, edición manual sin confirmar, o mismatch',
  })
  async regenerarPlanSemanal(
    @Body() dto: SolicitudRegeneracionHttpDTO,
    @CurrentUser() user: { id: number; personaId: number; gimnasioId: number },
  ): Promise<RespuestaRegenerarPlan> {
    return this.regenerarPlanSemanalUseCase.execute({
      planAlimentacionVersionId: dto.planAlimentacionVersionId,
      nutricionistaUserId: user.personaId,
      gimnasioId: user.gimnasioId,
      scope: dto.scope,
      dia: dto.dia,
      comidaSlot: dto.comidaSlot,
      alternativaIndex: dto.alternativaIndex,
      confirmarPerdidaEdicionManual: dto.confirmarPerdidaEdicionManual,
    });
  }

  @Post('sustitucion')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.SOCIO)
  @ApiOperation({ summary: 'Sugerir sustitución de alimento con IA' })
  @ApiResponse({
    status: 201,
    description: 'Sustitución sugerida exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async sugerirSustitucion(@Body() dto: SugerirSustitucionDto) {
    return this.sugerirSustitucionUseCase.execute({
      alimento: dto.alimento,
      razon: dto.razon,
    });
  }

  @Post('analisis')
  @Rol(RolEnum.NUTRICIONISTA)
  @ApiOperation({ summary: 'Analizar plan nutricional con IA' })
  @ApiResponse({ status: 201, description: 'Análisis completado exitosamente' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async analizarPlan(@Body() dto: AnalizarPlanDto) {
    return this.analizarPlanNutricionalUseCase.execute({
      planId: dto.planId,
    });
  }

  @Post('ideas-comida')
  @Rol(RolEnum.NUTRICIONISTA)
  @ApiOperation({
    summary: 'Generar exactamente 2 ideas de comida con IA (RF36-RF38)',
  })
  @ApiResponse({
    status: 201,
    description: 'Exactamente 2 propuestas generadas exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos, restricciones no cumplibles o error de IA',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async generarIdeasComida(@Body() dto: GenerarIdeasComidaInputDto) {
    const socioId = dto.socioId ?? 0;
    return this.generarIdeasComidaUseCase.execute(socioId, dto);
  }
}
