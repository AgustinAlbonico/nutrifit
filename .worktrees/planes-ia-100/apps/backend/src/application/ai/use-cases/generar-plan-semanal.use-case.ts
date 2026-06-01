import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { PrepararContextoPacienteUseCase } from './preparar-contexto-paciente.use-case';
import {
  ContextoPaciente,
  PlanSemanalIA,
  PlanSemanalDraft,
  RespuestaPlanSemanalDraft,
  SolicitudPlanSemanal,
} from '@nutrifit/shared';
import { DISCLAIMER_IA } from './generar-recomendacion-comida.use-case';
import { ValidadorPlanSemanalUseCase } from './validador-plan-semanal.use-case';
import {
  CALORIAS_MINIMAS_DIARIAS,
  CALORIAS_MAXIMAS_DIARIAS,
  MAX_REINTENTOS_GENERACION,
} from './constants';

@Injectable()
export class GenerarPlanSemanalUseCase implements BaseUseCase {
  constructor(
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    private readonly prepararContextoPaciente: PrepararContextoPacienteUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly validadorPlanSemanal: ValidadorPlanSemanalUseCase,
  ) {}

  async execute(
    solicitud: SolicitudPlanSemanal,
  ): Promise<RespuestaPlanSemanalDraft> {
    let ultimoError: string | null = null;
    let reintentos = 0;

    try {
      const contexto = await this.prepararContextoPaciente.execute(
        solicitud.socioId,
      );

      const caloriasObjetivo = this.calcularCaloriasObjetivo(
        contexto,
        solicitud.caloriasObjetivo,
      );

      const diasAGenerar = Math.min(solicitud.diasAGenerar ?? 7, 7);

      // Bucle de reintentos con retroalimentación interna
      while (reintentos < MAX_REINTENTOS_GENERACION) {
        reintentos += 1;

        this.logger.log(
          `Intento ${reintentos}/${MAX_REINTENTOS_GENERACION} de generar plan semanal para socio ${solicitud.socioId}`,
        );

        try {
          const plan = await this.generarPlanContexto(
            contexto,
            caloriasObjetivo,
            diasAGenerar,
            ultimoError,
          );

          // Validación estricta - NO acepta placeholders ni clonación
          const resultadoValidacion = this.validadorPlanSemanal.validar(
            plan,
            contexto,
            diasAGenerar,
          );

          if (resultadoValidacion.valido) {
            this.logger.log(
              `Plan semanal generado para socio ${solicitud.socioId}. ${diasAGenerar} días, ${caloriasObjetivo} kcal/día (intento ${reintentos})`,
            );

            // Construir borrador estable con metadatos
            const borrador: PlanSemanalDraft = {
              estado: 'borrador',
              socioId: solicitud.socioId,
              fechaCreacion: new Date().toISOString(),
              plan: plan,
              error: null,
              disclaimer: DISCLAIMER_IA,
            };

            return {
              exito: true,
              datos: borrador,
              error: null,
              disclaimer: DISCLAIMER_IA,
            };
          }

          // Plan inválido - registrar errores y reintentar con retroalimentación
          ultimoError = resultadoValidacion.errores.join(' | ');
          this.logger.log(
            `Intento ${reintentos} falló: ${ultimoError}. Reintentando...`,
          );
        } catch (error) {
          ultimoError = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error en intento ${reintentos}: ${ultimoError}`);
        }
      }

      // Agotó todos los reintentos - devolver borrador fallido
      const mensajeError = `No se pudo generar un plan válido después de ${MAX_REINTENTOS_GENERACION} intentos. Última falla: ${ultimoError}`;
      this.logger.error(mensajeError);

      const borradorFallido: PlanSemanalDraft = {
        estado: 'error',
        socioId: solicitud.socioId,
        fechaCreacion: new Date().toISOString(),
        plan: null,
        error: mensajeError,
        disclaimer: DISCLAIMER_IA,
      };

      return {
        exito: false,
        datos: borradorFallido,
        error: mensajeError,
        disclaimer: DISCLAIMER_IA,
      };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generando plan semanal: ${mensaje}`);

      const borradorFallido: PlanSemanalDraft = {
        estado: 'error',
        socioId: solicitud.socioId,
        fechaCreacion: new Date().toISOString(),
        plan: null,
        error: mensaje,
        disclaimer: DISCLAIMER_IA,
      };

      return {
        exito: false,
        datos: borradorFallido,
        error: mensaje,
        disclaimer: DISCLAIMER_IA,
      };
    }
  }

  /**
   * Genera un plan usando el proveedor de IA con retroalimentación de errores previos.
   */
  private async generarPlanContexto(
    contexto: ContextoPaciente,
    caloriasObjetivo: number,
    diasAGenerar: number,
    errorPrevio: string | null,
  ): Promise<PlanSemanalIA> {
    const prompt = this.construirPrompt(
      contexto,
      caloriasObjetivo,
      diasAGenerar,
      errorPrevio,
    );

    const schema = {
      dias: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dia: { type: 'number' },
            comidas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  ingredientes: { type: 'array', items: { type: 'string' } },
                  caloriasEstimadas: { type: 'number' },
                  proteinas: { type: 'number' },
                  carbohidratos: { type: 'number' },
                  grasas: { type: 'number' },
                  tipoComida: { type: 'string' },
                },
                required: [
                  'nombre',
                  'descripcion',
                  'ingredientes',
                  'caloriasEstimadas',
                  'tipoComida',
                ],
              },
            },
          },
          required: ['dia', 'comidas'],
        },
      },
      caloriasTotalesDiarias: { type: 'number' },
      disclaimer: { type: 'string' },
    };

    return this.aiProvider.generarRecomendacion<PlanSemanalIA>(prompt, schema);
  }

  private calcularCaloriasObjetivo(
    contexto: ContextoPaciente,
    caloriasSugeridas?: number,
  ): number {
    if (caloriasSugeridas) {
      return Math.max(
        CALORIAS_MINIMAS_DIARIAS,
        Math.min(CALORIAS_MAXIMAS_DIARIAS, caloriasSugeridas),
      );
    }

    if (contexto.peso && contexto.altura) {
      const tmb =
        10 * contexto.peso + 6.25 * contexto.altura * 100 - 5 * 30 + 5;
      const factorActividad = this.obtenerFactorActividad(
        contexto.nivelActividadFisica,
      );
      const caloriasEstimadas = Math.round(tmb * factorActividad);

      return Math.max(
        CALORIAS_MINIMAS_DIARIAS,
        Math.min(CALORIAS_MAXIMAS_DIARIAS, caloriasEstimadas),
      );
    }

    return 2000;
  }

  private obtenerFactorActividad(nivel: string): number {
    switch (nivel) {
      case 'SEDENTARIO':
        return 1.2;
      case 'BAJO':
        return 1.375;
      case 'MODERADO':
        return 1.55;
      case 'ALTO':
        return 1.725;
      default:
        return 1.2;
    }
  }

  private construirPrompt(
    contexto: ContextoPaciente,
    caloriasObjetivo: number,
    diasAGenerar: number,
    errorPrevio: string | null,
  ): string {
    // Agregar retroalimentación previa si existe
    const retroalimentacion = errorPrevio
      ? `\n\nERRORES ANTERIORES A CORREGIR:\n${errorPrevio}\n`
      : '';

    return `Eres un nutricionista profesional. Genera un plan alimenticio semanal para un paciente.

CONTEXTO DEL PACIENTE (anonimizado):
- Objetivo: ${contexto.objetivoPersonal}
- Nivel de actividad física: ${contexto.nivelActividadFisica}
- Peso: ${contexto.peso ?? 'No especificado'} kg
- Altura: ${contexto.altura ?? 'No especificado'} cm
- Alergias: ${contexto.alergias.length > 0 ? contexto.alergias.join(', ') : 'Ninguna'}
- Patologías: ${advertenciasPatologias(contexto.patologias)}
- Restricciones alimentarias: ${contexto.restriccionesAlimentarias ?? 'Ninguna'}
- Frecuencia de comidas: ${contexto.frecuenciaComidas ?? '4'} comidas diarias
- Medicamentos actuales: ${contexto.medicamentosActuales ?? 'Ninguno'}${retroalimentacion}

PARÁMETROS DEL PLAN:
- Calorías objetivo diarias: ${caloriasObjetivo} kcal
- Días a generar: ${diasAGenerar}
- Comidas por día (OBLIGATORIAS): DESAYUNO, ALMUERZO, MERIENDA, CENA, COLACION

REGLAS CRÍTICAS - MODO ESTRICTO:
1. NUNCA incluyas ingredientes que estén en las alergias del paciente
2. Considera las patologías y restricciones alimentarias
3. Distribuye las calorías de forma equilibrada entre las comidas
4. Varía las comidas entre días para evitar repetición excesiva
5. Incluye variedad de alimentos y grupos alimenticios
6. Debes devolver EXACTAMENTE ${diasAGenerar} días, numerados desde 1 hasta ${diasAGenerar}
7. Cada día debe incluir EXACTAMENTE 5 comidas: DESAYUNO, ALMUERZO, MERIENDA, CENA y COLACION
8. La COLACION es obligatoria en TODOS los días
9. NO uses placeholders genéricos como "Comida X" o descripciones vacías
10. Cada comida debe tener ingredientes específicos y descripciones detalladas
11. Responde SOLO con el JSON solicitado - sin texto adicional

Genera el plan en formato JSON estricto.`;
  }
}

function advertenciasPatologias(patologias: string[]): string {
  if (patologias.length === 0) return 'Ninguna';
  return patologias.join(', ');
}
