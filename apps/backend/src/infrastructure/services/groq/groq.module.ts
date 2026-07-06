import { Module } from '@nestjs/common';
import { AI_PROVIDER_SERVICE } from '../../../domain/services/ai-provider.service';
import { AiProviderOrchestratorService } from './ai-provider-orchestrator.service';
import { GeminiService } from './gemini.service';
import { GroqService } from './groq.service';
import { OpenRouterService } from './openrouter.service';

/**
 * Módulo de infraestructura para la integración con Groq API.
 * Inyecta GroqService como proveedor de IA.
 */
@Module({
  providers: [
    GroqService,
    GeminiService,
    OpenRouterService,
    {
      provide: AI_PROVIDER_SERVICE,
      useClass: AiProviderOrchestratorService,
    },
  ],
  exports: [AI_PROVIDER_SERVICE],
})
export class GroqModule {}
