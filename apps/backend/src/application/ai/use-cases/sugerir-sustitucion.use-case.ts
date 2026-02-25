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
import {
  RespuestaIA,
  SolicitudSustitucion,
  SustitucionAlimento,
} from '@nutrifit/shared';
import { DISCLAIMER_IA } from './generar-recomendacion-comida.use-case';

@Injectable()
export class SugerirSustitucionUseCase implements BaseUseCase {
  constructor(
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudSustitucion,
  ): Promise<RespuestaIA<SustitucionAlimento>> {
    try {
      const prompt = this.construirPrompt(solicitud);

      const schema = {
        alimentoOriginal: { type: 'string' },
        alimentoSugerido: { type: 'string' },
        razon: { type: 'string' },
        caloriasEquivalentes: { type: 'boolean' },
      };

      const resultado =
        await this.aiProvider.generarRecomendacion<SustitucionAlimento>(
          prompt,
          schema,
        );

      this.logger.log(
        `Sustitución sugerida: ${solicitud.alimento} -> ${resultado.alimentoSugerido}`,
      );

      return {
        exito: true,
        datos: resultado,
        error: null,
        disclaimer: DISCLAIMER_IA,
      };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error sugiriendo sustitución: ${mensaje}`);

      return {
        exito: false,
        datos: null,
        error: mensaje,
        disclaimer: DISCLAIMER_IA,
      };
    }
  }

  private construirPrompt(solicitud: SolicitudSustitucion): string {
    const razon = solicitud.razon ?? 'preferencia personal';

    return `Eres un nutricionista profesional. Sugiere UNA sustitución para un alimento.

SOLICITUD:
- Alimento a sustituir: ${solicitud.alimento}
- Razón de la sustitución: ${razon}

REGLAS IMPORTANTES:
1. El alimento sugerido debe tener valor nutricional similar
2. Considera la razón de la sustitución (alergia, preferencia, disponibilidad)
3. La sustitución debe ser práctica y accesible en Argentina
4. Si las calorías son equivalentes, marca caloriasEquivalentes como true
5. Explica brevemente la razón nutricional de la sustitución
6. Responde SOLO con el JSON solicitado

Genera la sugerencia en formato JSON.`;
  }
}
