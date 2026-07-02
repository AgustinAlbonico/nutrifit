import { Injectable, Logger } from '@nestjs/common';
import type {
  ConfiguracionGeneracionIA,
  IAiProviderService,
} from '../../../domain/services/ai-provider.service';
import { EnvironmentConfigService } from '../../../infrastructure/config/environment-config/environment-config.service';
import { AIRateLimitError } from 'src/domain/exceptions/custom-exceptions';
import OpenAI from 'openai';

const TEMPERATURA_DEFAULT = 0.7;
const MAX_TOKENS_DEFAULT = 2048;
const TIMEOUT_DEFAULT_MS = 120000;

/**
 * Servicio para interactuar con la API de Groq.
 * Implementa IAiProviderService con timeouts controlados y manejo de errores.
 */
@Injectable()
export class GroqService implements IAiProviderService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: OpenAI;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly configService: EnvironmentConfigService) {
    this.baseUrl = this.configService.getGroqBaseUrl();
    this.model = this.configService.getGroqModel();
    this.client = new OpenAI({
      apiKey: this.configService.getGroqApiKey(),
      baseURL: this.baseUrl,
    });
  }

  async generarRecomendacion<T>(
    prompt: string,
    configuracion: object | ConfiguracionGeneracionIA = {},
  ): Promise<T> {
    try {
      this.logger.log('Iniciando llamada a Groq API');

      const { schema, temperature, maxTokens, timeoutMs } =
        this.normalizarConfiguracion(configuracion);
      const schemaDescription = JSON.stringify(schema, null, 2);

      const response = await this.client.chat.completions.create(
        {
          messages: [
            {
              role: 'system',
              content:
                'Eres un asistente de nutrición profesional. DEBES responder ÚNICAMENTE con un JSON válido que coincida exactamente con el esquema proporcionado. No incluyas texto adicional, markdown ni explicaciones fuera del JSON.',
            },
            {
              role: 'user',
              content: `${prompt}\n\nEsquema JSON requerido:\n${schemaDescription}\n\nResponde SOLO con el JSON, sin texto adicional.`,
            },
          ],
          model: this.model,
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        },
        { timeout: timeoutMs },
      );

      const content = response.choices[0].message?.content;

      if (!content) {
        throw new Error('La API de Groq no devolvió contenido');
      }

      const parsed = JSON.parse(content) as T;
      this.logger.log('Respuesta de Groq API procesada exitosamente');

      return parsed;
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error en GroqService: ${detalle}`);

      const status = (error as { status?: number })?.status;
      if (status === 429) {
        const mensajeGroq = (error as { error?: { message?: string } })?.error?.message ?? detalle;
        const retryMatch = mensajeGroq.match(/try again in\s+([0-9hms.]+)/i);
        const retryTexto = retryMatch?.[1]?.trim();
        throw new AIRateLimitError(mensajeGroq, {
          retryTexto,
          proveedor: 'groq',
        });
      }

      throw new Error(`No se pudo generar la recomendación: ${detalle}`);
    }
  }

  private normalizarConfiguracion(
    configuracion: object | ConfiguracionGeneracionIA,
  ): {
    schema: object;
    temperature: number;
    maxTokens: number;
    timeoutMs: number;
  } {
    const registro = configuracion as Record<string, unknown>;
    const esConfiguracionProveedor =
      'schema' in registro ||
      'temperature' in registro ||
      'max_tokens' in registro ||
      'maxTokens' in registro ||
      'timeoutMs' in registro;

    const schema = esConfiguracionProveedor
      ? this.obtenerSchemaDesdeConfiguracion(registro)
      : configuracion;

    return {
      schema,
      temperature: this.obtenerNumero(
        registro.temperature,
        TEMPERATURA_DEFAULT,
      ),
      maxTokens: this.obtenerNumero(
        registro.max_tokens ?? registro.maxTokens,
        MAX_TOKENS_DEFAULT,
      ),
      timeoutMs: this.obtenerNumero(registro.timeoutMs, TIMEOUT_DEFAULT_MS),
    };
  }

  private obtenerSchemaDesdeConfiguracion(
    registro: Record<string, unknown>,
  ): object {
    if (
      registro.schema &&
      typeof registro.schema === 'object' &&
      !Array.isArray(registro.schema)
    ) {
      return registro.schema;
    }
    return {};
  }

  private obtenerNumero(valor: unknown, valorDefault: number): number {
    return typeof valor === 'number' && Number.isFinite(valor)
      ? valor
      : valorDefault;
  }

  verificarConexion(): Promise<boolean> {
    try {
      const apiKey = this.configService.getGroqApiKey();

      if (!apiKey) {
        this.logger.warn('GROQ_API_KEY no configurada');
        return Promise.resolve(false);
      }

      // Verificar si la API key tiene formato válido
      if (apiKey.length < 20) {
        this.logger.warn('GROQ_API_KEY tiene formato inválido');
        return Promise.resolve(false);
      }

      this.logger.log('Groq API configurada correctamente');

      return Promise.resolve(true);
    } catch (error) {
      this.logger.error(`Error verificando conexión Groq: ${error}`);
      return Promise.resolve(false);
    }
  }
}
