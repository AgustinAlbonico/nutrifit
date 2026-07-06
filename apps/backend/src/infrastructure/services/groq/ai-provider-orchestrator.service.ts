import { Injectable, Logger } from '@nestjs/common';

import {
  AIRateLimitError,
  ServiceUnavailableError,
} from 'src/domain/exceptions/custom-exceptions';
import type {
  ConfiguracionGeneracionIA,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import type { AiProviderName } from 'src/infrastructure/config/environment-config/environment-config.service';
import { EnvironmentConfigService } from 'src/infrastructure/config/environment-config/environment-config.service';

import { GeminiService } from './gemini.service';
import { GroqService } from './groq.service';
import { OpenRouterService } from './openrouter.service';

interface ProveedorIaConfigurado {
  nombre: AiProviderName;
  servicio: IAiProviderService;
}

@Injectable()
export class AiProviderOrchestratorService implements IAiProviderService {
  private readonly logger = new Logger(AiProviderOrchestratorService.name);

  constructor(
    private readonly configService: EnvironmentConfigService,
    private readonly groqService: GroqService,
    private readonly geminiService: GeminiService,
    private readonly openRouterService: OpenRouterService,
  ) {}

  async generarRecomendacion<T>(
    prompt: string,
    configuracion: object | ConfiguracionGeneracionIA = {},
  ): Promise<T> {
    const proveedores = this.obtenerProveedoresConfigurados();

    if (proveedores.length === 0) {
      throw new ServiceUnavailableError(
        'No hay proveedores de IA configurados para generar el plan.',
      );
    }

    let ultimoError: unknown;

    for (const proveedor of proveedores) {
      if (!(await proveedor.servicio.verificarConexion())) {
        this.logger.warn(
          `Proveedor IA omitido por falta de configuración: ${proveedor.nombre}`,
        );
        continue;
      }

      try {
        this.logger.log(`Generando recomendación con ${proveedor.nombre}`);
        return await proveedor.servicio.generarRecomendacion<T>(
          prompt,
          configuracion,
        );
      } catch (error) {
        ultimoError = error;
        if (!this.esErrorTransitorioProveedor(error)) {
          throw error;
        }

        this.logger.warn(
          `Proveedor IA ${proveedor.nombre} no disponible temporalmente. Probando fallback.`,
        );
      }
    }

    if (ultimoError instanceof Error) {
      throw ultimoError;
    }

    throw new ServiceUnavailableError(
      'No hay proveedores de IA disponibles para generar el plan.',
    );
  }

  async verificarConexion(): Promise<boolean> {
    const proveedores = this.obtenerProveedoresConfigurados();
    const estados = await Promise.all(
      proveedores.map((proveedor) => proveedor.servicio.verificarConexion()),
    );
    return estados.some(Boolean);
  }

  private obtenerProveedoresConfigurados(): ProveedorIaConfigurado[] {
    const disponibles: Record<AiProviderName, IAiProviderService> = {
      groq: this.groqService,
      gemini: this.geminiService,
      openrouter: this.openRouterService,
    };

    return this.configService.getAiProviderChain().map((nombre) => ({
      nombre,
      servicio: disponibles[nombre],
    }));
  }

  private esErrorTransitorioProveedor(error: unknown): boolean {
    return (
      error instanceof AIRateLimitError || error instanceof ServiceUnavailableError
    );
  }
}
