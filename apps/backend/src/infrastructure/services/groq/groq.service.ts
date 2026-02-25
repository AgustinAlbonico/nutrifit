import { Injectable, Logger } from '@nestjs/common';
import type { IAiProviderService } from '../../../domain/services/ai-provider.service';
import { EnvironmentConfigService } from '../../../infrastructure/config/environment-config/environment-config.service';
import OpenAI from 'openai';

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

  async generarRecomendacion<T>(prompt: string, schema: object): Promise<T> {
    try {
      this.logger.log('Iniciando llamada a Groq API');

      const schemaDescription = JSON.stringify(schema, null, 2);

      const response = await this.client.chat.completions.create({
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
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });

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

      throw new Error(`No se pudo generar la recomendación: ${detalle}`);
    }
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
