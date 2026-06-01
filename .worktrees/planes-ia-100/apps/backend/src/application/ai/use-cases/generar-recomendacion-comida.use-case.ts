import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
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
  RecomendacionComida,
  RespuestaIA,
  SolicitudRecomendacion,
} from '@nutrifit/shared';

export const DISCLAIMER_IA =
  'Esta recomendación es orientación general y no sustituye consejo médico profesional. Consulte siempre con su nutricionista.';

@Injectable()
export class GenerarRecomendacionComidaUseCase implements BaseUseCase {
  constructor(
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    private readonly prepararContextoPaciente: PrepararContextoPacienteUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudRecomendacion,
  ): Promise<RespuestaIA<RecomendacionComida[]>> {
    try {
      const contexto = await this.prepararContextoPaciente.execute(
        solicitud.socioId,
      );

      this.validarContexto(contexto);

      const prompt = this.construirPrompt(contexto, solicitud);

      const schema = {
        opciones: {
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
          },
        },
      };

      const resultado = await this.aiProvider.generarRecomendacion<{
        opciones: RecomendacionComida[];
      }>(prompt, schema);

      const opciones = resultado.opciones || [];
      for (const opcion of opciones) {
        this.validarRecomendacion(opcion, contexto);
      }

      this.logger.log(
        `Recomendaciones de comida generadas para socio ${solicitud.socioId}: ${opciones.length} opciones`,
      );

      return {
        exito: true,
        datos: opciones,
        error: null,
        disclaimer: DISCLAIMER_IA,
      };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generando recomendaciones: ${mensaje}`);

      return {
        exito: false,
        datos: null,
        error: mensaje,
        disclaimer: DISCLAIMER_IA,
      };
    }
  }

  private validarContexto(contexto: ContextoPaciente): void {
    if (contexto.alergias.length > 10) {
      throw new BadRequestError(
        'Demasiadas alergias registradas. Consulte con su nutricionista para una recomendación personalizada.',
      );
    }
  }

  private construirPrompt(
    contexto: ContextoPaciente,
    solicitud: SolicitudRecomendacion,
  ): string {
    const tipoComida = solicitud.tipoComida ?? 'ALMUERZO';
    const preferencias = solicitud.preferenciasAdicionales ?? 'Ninguna';

    return `Eres un nutricionista profesional. Genera CINCO (5) opciones de comida diferentes para un paciente.

CONTEXTO DEL PACIENTE (anonimizado):
- Objetivo: ${contexto.objetivoPersonal}
- Nivel de actividad física: ${contexto.nivelActividadFisica}
- Peso: ${contexto.peso ?? 'No especificado'} kg
- Altura: ${contexto.altura ?? 'No especificado'} cm
- Alergias: ${contexto.alergias.length > 0 ? contexto.alergias.join(', ') : 'Ninguna'}
- Patologías: ${contexto.patologias.length > 0 ? contexto.patologias.join(', ') : 'Ninguna'}
- Restricciones alimentarias: ${contexto.restriccionesAlimentarias ?? 'Ninguna'}
- Frecuencia de comidas: ${contexto.frecuenciaComidas ?? 'No especificado'}
- Medicamentos actuales: ${contexto.medicamentosActuales ?? 'Ninguno'}
- Suplementos actuales: ${contexto.suplementosActuales ?? 'Ninguno'}

SOLICITUD:
- Tipo de comida: ${tipoComida}
- Preferencias adicionales: ${preferencias}

REGLAS IMPORTANTES:
1. NUNCA incluyas ingredientes que estén en las alergias del paciente
2. Considera las patologías y restricciones alimentarias
3. Las calorías deben estar entre 200-800 kcal por comida
4. El balance de macronutrientes debe ser saludable
5. Responde SOLO con el JSON solicitado, sin texto adicional
6. Genera EXACTAMENTE 5 opciones DIFERENTES entre sí
7. Varía los ingredientes y estilos de preparación entre opciones

Genera las recomendaciones en formato JSON con un array "opciones".`;
  }

  private validarRecomendacion(
    recomendacion: RecomendacionComida,
    contexto: ContextoPaciente,
  ): void {
    if (recomendacion.caloriasEstimadas < 200) {
      recomendacion.caloriasEstimadas = 200;
    }
    if (recomendacion.caloriasEstimadas > 800) {
      recomendacion.caloriasEstimadas = 800;
    }

    const ingredientesLower = recomendacion.ingredientes.map((i) =>
      i.toLowerCase(),
    );
    for (const alergia of contexto.alergias) {
      const alergiaLower = alergia.toLowerCase();
      const contieneAlergeno = ingredientesLower.some((ing) =>
        ing.includes(alergiaLower),
      );
      if (contieneAlergeno) {
        throw new BadRequestError(
          `La recomendación contiene un alérgeno: ${alergia}. Por seguridad, no se puede sugerir esta comida.`,
        );
      }
    }
  }
}
