import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import {
  AnalisisNutricional,
  RespuestaIA,
  SolicitudAnalisis,
} from '@nutrifit/shared';
import { DISCLAIMER_IA } from './generar-recomendacion-comida.use-case';

@Injectable()
export class AnalizarPlanNutricionalUseCase implements BaseUseCase {
  constructor(
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepository: Repository<PlanAlimentacionOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudAnalisis,
  ): Promise<RespuestaIA<AnalisisNutricional>> {
    try {
      const plan = await this.planRepository.findOne({
        where: { idPlanAlimentacion: solicitud.planId },
        relations: [
          'dias',
          'dias.opcionesComida',
          'dias.opcionesComida.items',
          'dias.opcionesComida.items.alimento',
        ],
      });

      if (!plan) {
        throw new NotFoundError(
          'Plan de alimentación',
          String(solicitud.planId),
        );
      }

      const resumenPlan = this.extraerResumenPlan(plan);

      const prompt = this.construirPrompt(resumenPlan);

      const schema = {
        caloriasDiarias: { type: 'number' },
        proteinasGramos: { type: 'number' },
        carbohidratosGramos: { type: 'number' },
        grasasGramos: { type: 'number' },
        fibraGramos: { type: 'number' },
        sodioMg: { type: 'number' },
        azucaresGramos: { type: 'number' },
        distribucionMacros: {
          type: 'object',
          properties: {
            proteinas: { type: 'number' },
            carbohidratos: { type: 'number' },
            grasas: { type: 'number' },
          },
        },
        advertencias: { type: 'array', items: { type: 'string' } },
      };

      const resultado =
        await this.aiProvider.generarRecomendacion<AnalisisNutricional>(
          prompt,
          schema,
        );

      this.validarAnalisis(resultado);

      this.logger.log(
        `Análisis nutricional completado para plan ${solicitud.planId}`,
      );

      return {
        exito: true,
        datos: resultado,
        error: null,
        disclaimer: DISCLAIMER_IA,
      };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error analizando plan nutricional: ${mensaje}`);

      return {
        exito: false,
        datos: null,
        error: mensaje,
        disclaimer: DISCLAIMER_IA,
      };
    }
  }

  private extraerResumenPlan(plan: PlanAlimentacionOrmEntity): string {
    const dias = plan.dias ?? [];
    let resumen = `Plan con ${dias.length} días.\n`;

    for (const dia of dias) {
      resumen += `\nDía ${dia.dia} (orden: ${dia.orden}):\n`;
      const opciones = dia.opcionesComida ?? [];
      for (const opcion of opciones) {
        const alimentosStr = (opcion.items ?? [])
          .map((item) => item.alimento?.nombre ?? item.alimentoNombre)
          .join(', ');
        resumen += `- ${opcion.tipoComida}: ${alimentosStr || 'Sin alimentos'}${opcion.comentarios ? ` (${opcion.comentarios})` : ''}\n`;
      }
    }

    return resumen;
  }

  private construirPrompt(resumenPlan: string): string {
    return `Eres un nutricionista profesional. Analiza el siguiente plan de alimentación y proporciona un análisis nutricional.

PLAN DE ALIMENTACIÓN:
${resumenPlan}

ANÁLISIS REQUERIDO:
1. Estima las calorías diarias promedio
2. Estima los gramos de macronutrientes (proteínas, carbohidratos, grasas)
3. Estima fibra, sodio y azúcares si es posible
4. Calcula la distribución porcentual de macronutrientes
5. Identifica advertencias o mejoras potenciales

REGLAS IMPORTANTES:
1. Los valores deben ser estimaciones realistas basadas en los alimentos mencionados
2. Las advertencias deben ser específicas y útiles
3. Si falta información, usa null para esos valores
4. Responde SOLO con el JSON solicitado

Genera el análisis en formato JSON.`;
  }

  private validarAnalisis(analisis: AnalisisNutricional): void {
    if (analisis.caloriasDiarias < 1000) {
      analisis.caloriasDiarias = 1000;
    }
    if (analisis.caloriasDiarias > 4000) {
      analisis.caloriasDiarias = 4000;
    }

    const totalMacros =
      analisis.distribucionMacros.proteinas +
      analisis.distribucionMacros.carbohidratos +
      analisis.distribucionMacros.grasas;

    if (Math.abs(totalMacros - 100) > 5) {
      const factor = 100 / totalMacros;
      analisis.distribucionMacros.proteinas = Math.round(
        analisis.distribucionMacros.proteinas * factor,
      );
      analisis.distribucionMacros.carbohidratos = Math.round(
        analisis.distribucionMacros.carbohidratos * factor,
      );
      analisis.distribucionMacros.grasas =
        100 -
        analisis.distribucionMacros.proteinas -
        analisis.distribucionMacros.carbohidratos;
    }

    if (!analisis.advertencias) {
      analisis.advertencias = [];
    }
  }
}
