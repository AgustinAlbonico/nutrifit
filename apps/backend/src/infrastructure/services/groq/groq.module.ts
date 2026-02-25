import { Module } from '@nestjs/common';
import { AI_PROVIDER_SERVICE } from '../../../domain/services/ai-provider.service';
import { GroqService } from './groq.service';

/**
 * Módulo de infraestructura para la integración con Groq API.
 * Inyecta GroqService como proveedor de IA.
 */
@Module({
  providers: [
    {
      provide: AI_PROVIDER_SERVICE,
      useClass: GroqService,
    },
  ],
  exports: [AI_PROVIDER_SERVICE],
})
export class GroqModule {}
