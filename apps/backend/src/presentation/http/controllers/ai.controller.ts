import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  GenerarRecomendacionDto,
  GenerarPlanSemanalDto,
  SugerirSustitucionDto,
  AnalizarPlanDto,
} from 'src/application/ai/dto';
import { GenerarIdeasComidaInputDto } from 'src/application/ai/dto/generar-ideas-comida.dto';
import {
  GenerarRecomendacionComidaUseCase,
  GenerarPlanSemanalUseCase,
  SugerirSustitucionUseCase,
  AnalizarPlanNutricionalUseCase,
  GenerarIdeasComidaUseCase,
} from 'src/application/ai/use-cases';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';

@ApiTags('IA - Recomendaciones Nutricionales')
@ApiBearerAuth()
@Controller('ia')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly generarRecomendacionUseCase: GenerarRecomendacionComidaUseCase,
    private readonly generarPlanSemanalUseCase: GenerarPlanSemanalUseCase,
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
  @Rol(RolEnum.NUTRICIONISTA)
  @ApiOperation({ summary: 'Generar plan semanal con IA' })
  @ApiResponse({
    status: 201,
    description: 'Plan semanal generado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o alérgenos detectados',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async generarPlanSemanal(@Body() dto: GenerarPlanSemanalDto) {
    return this.generarPlanSemanalUseCase.execute({
      socioId: dto.socioId,
      caloriasObjetivo: dto.caloriasObjetivo,
      diasAGenerar: dto.diasAGenerar,
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
