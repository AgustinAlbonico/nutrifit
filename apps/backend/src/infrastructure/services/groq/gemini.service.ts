import { Injectable, Logger } from '@nestjs/common';

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
const TIMEOUT_DEFAULT_MS = 120000;

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

@Injectable()
export class GeminiService implements IAiProviderService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(private readonly configService: EnvironmentConfigService) {
    this.apiKey = this.configService.getGeminiApiKey();
    this.model = this.configService.getGeminiModel();
  }

  async generarRecomendacion<T>(
    prompt: string,
    configuracion: object | ConfiguracionGeneracionIA = {},
  ): Promise<T> {
    if (!this.apiKey) {
      throw new ServiceUnavailableError('Gemini no está configurado.', {
        proveedor: 'gemini',
      });
    }

    const { schema, temperature, maxTokens, timeoutMs } =
      this.normalizarConfiguracion(configuracion);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      this.logger.log('Iniciando llamada a Gemini API');
      const response = await fetch(this.crearUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'Eres un asistente de nutrición profesional. DEBES responder ÚNICAMENTE con un JSON válido que coincida exactamente con el esquema proporcionado. No incluyas texto adicional, markdown ni explicaciones fuera del JSON.',
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${prompt}\n\nEsquema JSON requerido:\n${JSON.stringify(schema, null, 2)}\n\nResponde SOLO con el JSON, sin texto adicional.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
            responseJsonSchema: schema,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.lanzarErrorHttp(response);
      }

      const data = (await response.json()) as GeminiResponse;
      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();
      const finishReason = candidate?.finishReason;

      if (!content) {
        if (finishReason === 'SAFETY') {
          throw new Error(
            'La API de Gemini rechazó el contenido por seguridad (finishReason=SAFETY).',
          );
        }
        throw new ServiceUnavailableError(
          `La API de Gemini no devolvió contenido (finishReason=${finishReason ?? 'desconocido'}).`,
          { proveedor: 'gemini' },
        );
      }

      this.logger.log('Respuesta de Gemini API procesada exitosamente');
      return JSON.parse(content) as T;
    } catch (error) {
      if (error instanceof AIRateLimitError || error instanceof ServiceUnavailableError) {
        throw error;
      }

      if (this.esAbortError(error)) {
        throw new ServiceUnavailableError('Gemini no respondió a tiempo.', {
          proveedor: 'gemini',
        });
      }

      const detalle = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error en GeminiService: ${detalle}`);
      throw new Error(`No se pudo generar la recomendación con Gemini: ${detalle}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  verificarConexion(): Promise<boolean> {
    return Promise.resolve(Boolean(this.apiKey && this.apiKey.length >= 20));
  }

  private crearUrl(): string {
    const modeloCodificado = encodeURIComponent(this.model);
    return `https://generativelanguage.googleapis.com/v1beta/models/${modeloCodificado}:generateContent?key=${this.apiKey}`;
  }

  private async lanzarErrorHttp(response: Response): Promise<never> {
    const detalle = await this.leerMensajeError(response);

    if (response.status === 429) {
      throw new AIRateLimitError(detalle, { proveedor: 'gemini' });
    }

    if ([408, 500, 502, 503, 504].includes(response.status)) {
      throw new ServiceUnavailableError(detalle, { proveedor: 'gemini' });
    }

    throw new Error(detalle);
  }

  private async leerMensajeError(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      return body.error?.message ?? `Gemini respondió HTTP ${response.status}`;
    } catch {
      return `Gemini respondió HTTP ${response.status}`;
    }
  }

  private normalizarConfiguracion(configuracion: object | ConfiguracionGeneracionIA) {
    const registro = configuracion as Record<string, unknown>;
    const schema =
      registro.schema && typeof registro.schema === 'object'
        ? (registro.schema as object)
        : configuracion;

    return {
      schema,
      temperature: this.obtenerNumero(registro.temperature, TEMPERATURA_DEFAULT),
      maxTokens: this.obtenerNumero(
        registro.max_tokens ?? registro.maxTokens,
        MAX_TOKENS_DEFAULT,
      ),
      timeoutMs: this.obtenerNumero(registro.timeoutMs, TIMEOUT_DEFAULT_MS),
    };
  }

  private obtenerNumero(valor: unknown, valorDefault: number): number {
    return typeof valor === 'number' && Number.isFinite(valor)
      ? valor
      : valorDefault;
  }

  private esAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }
}
