import { Injectable, Logger } from '@nestjs/common';
import OpenAI, { APIConnectionError, APIConnectionTimeoutError } from 'openai';

import {
  AIRateLimitError,
  ServiceUnavailableError,
} from 'src/domain/exceptions/custom-exceptions';
import type {
  ConfiguracionGeneracionIA,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { EnvironmentConfigService } from 'src/infrastructure/config/environment-config/environment-config.service';

const TEMPERATURA_DEFAULT = 0.7;
const MAX_TOKENS_DEFAULT = 2048;
const MAX_TOKENS_MINIMO_OPENCODE = 16384;
const TIMEOUT_DEFAULT_MS = 120000;

@Injectable()
export class OpenCodeZenService implements IAiProviderService {
  private readonly logger = new Logger(OpenCodeZenService.name);

  constructor(private readonly configService: EnvironmentConfigService) {}

  async generarRecomendacion<T>(
    prompt: string,
    configuracion: object | ConfiguracionGeneracionIA = {},
  ): Promise<T> {
    const apiKey = this.configService.getOpenCodeApiKey();

    if (!apiKey) {
      throw new ServiceUnavailableError('OpenCode Zen no está configurado.', {
        proveedor: 'opencode',
      });
    }

    try {
      this.logger.log('Iniciando llamada a OpenCode Zen API');
      const { schema, temperature, maxTokens, timeoutMs } =
        this.normalizarConfiguracion(configuracion);

      const response = await this.crearCliente(apiKey).chat.completions.create(
        {
          messages: [
            {
              role: 'system',
              content:
                'Eres un asistente de nutrición profesional. DEBES responder ÚNICAMENTE con un JSON válido que coincida exactamente con el esquema proporcionado. No incluyas texto adicional, markdown ni explicaciones fuera del JSON. Tu respuesta completa debe ser parseable como JSON.',
            },
            {
              role: 'user',
              content: this.construirPromptUsuario(prompt, schema),
            },
          ],
          model: this.configService.getOpenCodeModel(),
          temperature,
          max_tokens: maxTokens,
        },
        { timeout: timeoutMs },
      );

      const choice = response.choices[0];
      const content = choice.message?.content;
      const finishReason = choice.finish_reason;

      if (!content) {
        if (finishReason === 'content_filter') {
          throw new Error(
            'La API de OpenCode Zen rechazó el contenido (finish_reason=content_filter).',
          );
        }
        if (finishReason === 'length') {
          throw new Error(
            `JSON truncado por OpenCode Zen (finish_reason=length, max_tokens=${maxTokens}).`,
          );
        }
        throw new ServiceUnavailableError(
          `La API de OpenCode Zen no devolvió contenido (finish_reason=${finishReason ?? 'desconocido'}).`,
          { proveedor: 'opencode' },
        );
      }

      if (finishReason === 'length') {
        throw new Error(
          `JSON truncado por OpenCode Zen (finish_reason=length, max_tokens=${maxTokens}).`,
        );
      }

      this.logger.log('Respuesta de OpenCode Zen API procesada exitosamente');
      return JSON.parse(this.limpiarContenidoJson(content)) as T;
    } catch (error) {
      const status = this.obtenerStatusError(error);
      const detalle = error instanceof Error ? error.message : String(error);
      const nombreError = this.obtenerNombreError(error);

      this.logger.error(
        `Error en OpenCodeZenService (${nombreError}${status ? ` status=${status}` : ''}): ${detalle}`,
      );

      if (
        error instanceof AIRateLimitError ||
        error instanceof ServiceUnavailableError
      ) {
        throw error;
      }

      if (status === 429) {
        throw new AIRateLimitError(detalle, { proveedor: 'opencode' });
      }

      if (this.esErrorConexionOpenAi(error)) {
        throw new ServiceUnavailableError(
          `OpenCode Zen no respondió a tiempo o rechazó la conexión: ${detalle}`,
          { proveedor: 'opencode' },
        );
      }

      if (status !== undefined && [408, 500, 502, 503, 504].includes(status)) {
        throw new ServiceUnavailableError(detalle, { proveedor: 'opencode' });
      }

      throw new Error(
        `No se pudo generar la recomendación con OpenCode Zen: ${detalle}`,
      );
    }
  }

  verificarConexion(): Promise<boolean> {
    const apiKey = this.configService.getOpenCodeApiKey();
    return Promise.resolve(Boolean(apiKey && apiKey.length >= 20));
  }

  private normalizarConfiguracion(
    configuracion: object | ConfiguracionGeneracionIA,
  ) {
    const registro = configuracion as Record<string, unknown>;
    const schema =
      registro.schema && typeof registro.schema === 'object'
        ? registro.schema
        : undefined;

    return {
      schema,
      temperature: this.obtenerNumero(
        registro.temperature,
        this.configService.getTemperatureIa('opencode') ?? TEMPERATURA_DEFAULT,
      ),
      maxTokens: Math.max(
        this.obtenerNumero(
          registro.max_tokens ?? registro.maxTokens,
          this.configService.getMaxTokensIa('opencode') ?? MAX_TOKENS_DEFAULT,
        ),
        MAX_TOKENS_MINIMO_OPENCODE,
      ),
      timeoutMs: this.obtenerNumero(
        registro.timeoutMs,
        this.configService.getTimeoutMsIa('opencode') ?? TIMEOUT_DEFAULT_MS,
      ),
    };
  }

  private crearCliente(apiKey: string): OpenAI {
    return new OpenAI({
      apiKey,
      baseURL: this.configService.getOpenCodeBaseUrl(),
      maxRetries: 0,
    });
  }

  private construirPromptUsuario(
    prompt: string,
    schema: object | undefined,
  ): string {
    const schemaTexto = schema
      ? `\n\nEsquema JSON requerido:\n${JSON.stringify(schema, null, 2)}`
      : '';

    return `${prompt}${schemaTexto}\n\nResponde SOLO con el JSON, sin texto adicional, sin bloques de código markdown y sin comentarios.`;
  }

  private obtenerNumero(valor: unknown, valorDefault: number): number {
    return typeof valor === 'number' && Number.isFinite(valor)
      ? valor
      : valorDefault;
  }

  private obtenerStatusError(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }

  private obtenerNombreError(error: unknown): string {
    return error instanceof Error ? error.constructor.name : typeof error;
  }

  private esErrorConexionOpenAi(error: unknown): boolean {
    return (
      error instanceof APIConnectionTimeoutError ||
      error instanceof APIConnectionError
    );
  }

  /**
   * Limpia el contenido devuelto por el modelo para hacerlo parseable como JSON.
   * Algunos modelos free-tier envuelven la respuesta en bloques de código markdown
   * (```json ... ```) o anteponen/posponen texto explicativo a pesar del system
   * prompt. Esta función extrae el primer objeto/arreglo JSON válido.
   */
  private limpiarContenidoJson(contenido: string): string {
    const texto = contenido.trim();

    // Caso 1: bloque markdown ```json ... ``` (o ``` sin lenguaje)
    const matchBloqueCodigo = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(texto);
    if (matchBloqueCodigo && matchBloqueCodigo[1]) {
      return matchBloqueCodigo[1].trim();
    }

    // Caso 2: el texto arranca con texto no-JSON antes del objeto/arreglo.
    const matchLlaves = texto.match(/[{[][\s\S]*[}\]]/);
    if (matchLlaves) {
      return matchLlaves[0];
    }

    return texto;
  }
}
