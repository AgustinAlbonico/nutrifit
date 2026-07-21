import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { RestriccionesValidator } from 'src/application/restricciones/restricciones-validator.service';
import {
  GenerarIdeasComidaInputDto,
  GenerarIdeasComidaOutputDto,
} from '../dto/generar-ideas-comida.dto';
import { PropuestaIA } from '@nutrifit/shared';
import { SugerenciaIAOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/sugerencia-ia.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SugerenciaEstado } from 'src/domain/entities/SugerenciaIA/sugerencia-ia.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

const DISCLAIMER_IA =
  'Esta sugerencia es generada por IA y debe ser validada por un profesional de la salud.';

interface RawIaResponse {
  propuestas?: Array<{
    nombre?: string;
    ingredientes?: Array<{
      nombre?: string;
      cantidad?: string;
      unidad?: string;
    }>;
    pasos?: string[];
  }>;
}

@Injectable()
export class GenerarIdeasComidaUseCase implements BaseUseCase {
  constructor(
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly restriccionesValidator: RestriccionesValidator,
    @InjectRepository(SugerenciaIAOrmEntity)
    private readonly sugerenciaRepo: Repository<SugerenciaIAOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    socioId: number,
    input: GenerarIdeasComidaInputDto,
  ): Promise<GenerarIdeasComidaOutputDto> {
    // El tenancy del socio dueño del token ya está garantizado por el guard HTTP.
    // Para evitar romper el flujo cuando no existe sugerencia previa (bug histórico
    // donde se buscaba solo en sugerencia_ia), hacemos una validación best-effort
    // tolerante a fallos de BD.
    const sugerenciaPrev = await this.sugerenciaRepo
      .findOne({
        where: { socioId },
        relations: { socio: true },
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Error buscando sugerencia previa (ignorado): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return null;
      });

    if (
      sugerenciaPrev &&
      sugerenciaPrev.socio.gimnasioId !== this.tenantContext.gimnasioId
    ) {
      throw new NotFoundError('Socio', String(socioId));
    }

    const restricciones = input.restricciones ?? [];
    const prompt = this.construirPrompt(input);
    const schema = {
      type: 'object',
      properties: {
        propuestas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              ingredientes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    nombre: { type: 'string' },
                    cantidad: { type: 'string' },
                    unidad: { type: 'string' },
                  },
                },
              },
              pasos: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    };

    const resultado = await this.aiProvider
      .generarRecomendacion<RawIaResponse>(prompt, schema)
      .catch((err: unknown) => {
        const detalle = err instanceof Error ? err.message : String(err);
        throw new BadRequestError(`IA no disponible: ${detalle}`);
      });

    const propuestasRaw = resultado.propuestas ?? [];

    const propuestasValidas: PropuestaIA[] = [];
    const propuestasDescartadas: string[] = [];

    for (const prop of propuestasRaw) {
      const propuesta: PropuestaIA = {
        nombre: prop.nombre ?? '',
        ingredientes:
          prop.ingredientes?.map((i) => ({
            nombre: i.nombre ?? '',
            cantidad: i.cantidad ?? '',
            unidad: i.unidad ?? '',
          })) ?? [],
        pasos: prop.pasos?.slice(0, 5) ?? [],
      };

      const esValida = this.restriccionesValidator.validarPropuesta(
        propuesta,
        restricciones,
      );

      if (esValida && propuestasValidas.length < 2) {
        propuestasValidas.push(propuesta);
      } else {
        propuestasDescartadas.push(propuesta.nombre);
      }
    }

    if (propuestasValidas.length < 2) {
      const mensaje = `No se pudieron generar 2 propuestas válidas. Se descartaron: ${
        propuestasDescartadas.join(', ') || 'ninguna'
      }. Intente con menos restricciones.`;
      this.logger.warn(mensaje);

      await this.persistirSugerencia(
        socioId,
        input,
        null,
        SugerenciaEstado.ERROR,
      );

      throw new BadRequestError(mensaje);
    }

    const output: GenerarIdeasComidaOutputDto = {
      propuestas: propuestasValidas.slice(0, 2),
    };

    await this.persistirSugerencia(
      socioId,
      input,
      propuestasValidas[0],
      SugerenciaEstado.GENERADA,
    );

    this.logger.log(
      `Ideas de comida generadas para socio ${socioId}: ${propuestasValidas.length} propuestas`,
    );

    return output;
  }

  private async persistirSugerencia(
    socioId: number,
    input: GenerarIdeasComidaInputDto,
    propuesta: PropuestaIA | null,
    estado: SugerenciaEstado,
  ): Promise<void> {
    try {
      await this.sugerenciaRepo.save({
        socioId,
        objetivo: input.objetivo,
        restricciones: input.restricciones ?? null,
        infoExtra: input.infoExtra,
        propuesta,
        estado,
      });
    } catch (err) {
      this.logger.warn(
        `Error guardando sugerencia ${estado} (ignorado): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private construirPrompt(input: GenerarIdeasComidaInputDto): string {
    const restriccionesTexto =
      input.restricciones && input.restricciones.length > 0
        ? `\nRESTRICCIONES ALIMENTARIAS: ${input.restricciones.join(', ')}`
        : '\nSin restricciones alimentarias específicas.';

    return `Eres un nutricionista profesional. Genera exactamente DOS (2) propuestas de comidas diferentes.

OBJETIVO NUTRICIONAL: ${input.objetivo}
CONTEXTO ADICIONAL: ${input.infoExtra}${restriccionesTexto}

REGLAS IMPORTANTES:
1. Cada propuesta debe tener un nombre distintivo
2. Cada ingrediente debe incluir nombre, cantidad y unidad (ej: "200 gramo", "1 taza", "1 unidad")
3. Los pasos de preparación deben ser entre 1 y 5
4. NUNCA incluyas ingredientes que violen las restricciones indicadas
5. Responde SOLO con el JSON solicitado, sin texto adicional
6. Genera EXACTAMENTE 2 propuestas diferentes

Formato JSON requerido:
{
  "propuestas": [
    {
      "nombre": "Nombre de la comida",
      "ingredientes": [
        { "nombre": "Ingrediente 1", "cantidad": "200", "unidad": "gramo" }
      ],
      "pasos": ["Paso 1", "Paso 2", "Paso 3"]
    }
  ]
}`;
  }
}
