import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import {
  AlimentoOrmEntity,
  FichaSaludOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import type { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { SOCIO_REPOSITORY } from 'src/domain/entities/Persona/Socio/socio.repository';
import type { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
import type { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { RestriccionesValidator } from 'src/application/restricciones/restricciones-validator.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import type { PlanAlimentacionVersionRepository } from 'src/domain/repositories/plan-alimentacion-version.repository';
import { randomUUID } from 'node:crypto';
import {
  PromptIdeasComidaBuilder,
  FichaSaludInput,
} from 'src/application/ia/builders/prompt-ideas-comida.builder';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import { normalizarTexto } from 'src/common/utils/text.util';

export interface AlternativaGenerada {
  idTemp: string;
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    alimentoNombre: string;
    nombre: string;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  etiquetas: string[];
  warnings: string[];
}

export interface RespuestaGenerarIdeas {
  promptUsado: string;
  alternativas: AlternativaGenerada[];
}

interface AlternativaRaw {
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    alimentoNombre?: string;
    nombre?: string;
  }>;
  calorias?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
}

const MAX_REINTENTOS_IA = 3;
const MAX_TOKENS_IDEAS_COMIDA = 4096;

interface RespuestaRawIdeasComida {
  ideas?: AlternativaRaw[];
  alternativas?: AlternativaRaw[];
  advertencias?: string[];
}

const RESPUESTA_IDEAS_COMIDA_SCHEMA = {
  type: 'object',
  properties: {
    alternativas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          alimentos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                alimentoId: { type: 'number' },
                alimentoNombre: { type: 'string' },
                cantidad: { type: 'number' },
                unidad: { type: 'string' },
              },
              required: ['alimentoNombre', 'cantidad', 'unidad'],
            },
          },
          calorias: { type: 'number' },
          proteinas: { type: 'number' },
          carbohidratos: { type: 'number' },
          grasas: { type: 'number' },
        },
        required: [
          'nombre',
          'alimentos',
          'calorias',
          'proteinas',
          'carbohidratos',
          'grasas',
        ],
      },
    },
    advertencias: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['alternativas'],
};

@Injectable()
export class GenerarIdeasComidaUseCase {
  private readonly promptBuilder = new PromptIdeasComidaBuilder();

  constructor(
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaRepo: Repository<FichaSaludOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepo: NutricionistaRepository,
    @Inject(SOCIO_REPOSITORY)
    private readonly _socioRepo: SocioRepository,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly _planVersionRepo: PlanAlimentacionVersionRepository,
    private readonly tenantContext: TenantContextService,
    private readonly restriccionesValidator: RestriccionesValidator,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    user: { personaId: number; gimnasioId: number; rol: string },
    dto: {
      planAlimentacionId: number;
      dia: DiaSemana;
      tipoComida: TipoComida;
      cantidadAlternativas?: number;
    },
  ): Promise<RespuestaGenerarIdeas> {
    const cantidad = dto.cantidadAlternativas ?? 10;

    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: dto.planAlimentacionId },
      relations: { nutricionista: true, socio: true },
    });

    if (!plan) {
      throw new NotFoundError(
        'Plan de alimentación',
        String(dto.planAlimentacionId),
      );
    }

    // Auth: el NUT debe ser dueño del plan o ser ADMIN
    const esDueno = plan.nutricionista?.idPersona === user.personaId;
    const esAdmin = user.rol === 'ADMIN';
    if (!esDueno && !esAdmin) {
      throw new ForbiddenError('No tenés permisos sobre este plan.');
    }

    const socioId = plan.socio.idPersona;
    if (socioId == null) {
      throw new NotFoundError('Socio', String(dto.planAlimentacionId));
    }

    const socioWhere: FindOptionsWhere<SocioEntity> = { idPersona: socioId };
    const ficha = await this.fichaRepo.findOne({
      where: { socio: socioWhere },
    });

    if (!ficha) {
      throw new BadRequestError(
        'El paciente no tiene ficha de salud. Completala antes de generar ideas.',
      );
    }

    const fichaParaValidar = {
      alergias: ficha.alergias?.map((a) => this.obtenerNombre(a)) ?? [],
      restriccionesAlimentarias: ficha.restriccionesAlimentarias ?? null,
      patologias:
        ficha.patologias?.map((p) => this.obtenerNombre(p)).filter(Boolean) ??
        [],
      medicacionActual: ficha.medicacionActual ?? null,
      suplementosActuales: ficha.suplementosActuales ?? null,
    };

    // Loop con reintentos: hasta que la salida pase el filtro
    const alternativasValidadas: AlternativaGenerada[] = [];
    let intento = 0;
    let ultimoPrompt = '';

    while (
      alternativasValidadas.length < cantidad &&
      intento < MAX_REINTENTOS_IA
    ) {
      intento++;
      const alternativasRaw = await this.generarUnaPasada(
        plan,
        ficha,
        dto,
        cantidad,
      );
      ultimoPrompt = alternativasRaw.prompt;

      for (const alt of alternativasRaw.alternativas) {
        const validacion = this.restriccionesValidator.validarAlternativa(
          fichaParaValidar,
          alt,
        );
        if (validacion.criticas.length === 0) {
          alternativasValidadas.push({
            ...alt,
            idTemp: randomUUID(),
            warnings: validacion.warnings,
          });
          if (alternativasValidadas.length >= cantidad) break;
        } else {
          this.logger.warn(
            `Idea descartada por restricciones críticas: ${alt.nombre} → ${validacion.criticas.map((c) => c.mensaje).join('; ')}`,
          );
        }
      }
    }

    if (alternativasValidadas.length === 0) {
      throw new BadRequestError(
        'La IA no generó alternativas válidas para este slot. Probá nuevamente o ajustá las restricciones del paciente.',
      );
    }

    return {
      promptUsado: ultimoPrompt,
      alternativas: alternativasValidadas.slice(0, cantidad),
    };
  }

  private async generarUnaPasada(
    _plan: PlanAlimentacionOrmEntity,
    ficha: FichaSaludOrmEntity,
    dto: { dia: DiaSemana; tipoComida: TipoComida },
    cantidad: number,
  ): Promise<{
    prompt: string;
    alternativas: Omit<AlternativaGenerada, 'idTemp' | 'warnings'>[];
  }> {
    const fichaInput: FichaSaludInput = {
      alergias: ficha.alergias?.map((a) => this.obtenerNombre(a)) ?? [],
      restriccionesAlimentarias: ficha.restriccionesAlimentarias ?? null,
      patologias:
        ficha.patologias?.map((p) => this.obtenerNombre(p)).filter(Boolean) ??
        [],
      medicacionActual: ficha.medicacionActual ?? null,
      suplementosActuales: ficha.suplementosActuales ?? null,
    };
    const catalogoAlimentos = await this.alimentoRepo.find({
      select: { idAlimento: true, nombre: true },
      order: { nombre: 'ASC' },
    });

    const { system, user } = this.promptBuilder.build({
      ficha: fichaInput,
      slot: { dia: dto.dia, tipoComida: dto.tipoComida },
      cantidad,
      alimentosDisponibles: catalogoAlimentos.map(
        (alimento) => alimento.nombre,
      ),
    });

    const promptCompleto = `${system}\n\n---\n\n${user}`;

    // Llamar al AI provider y parsear la respuesta JSON
    let resultado: RespuestaRawIdeasComida = {};
    try {
      resultado =
        await this.aiProvider.generarRecomendacion<RespuestaRawIdeasComida>(
          promptCompleto,
          {
            schema: RESPUESTA_IDEAS_COMIDA_SCHEMA,
            temperature: 0.4,
            max_tokens: MAX_TOKENS_IDEAS_COMIDA,
            timeoutMs: 30000,
          },
        );
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI provider error en generarUnaPasada: ${mensaje}`);
      // No lanzar — devolvemos vacío y el loop seguirá
      return { prompt: promptCompleto, alternativas: [] };
    }

    const alternativasRaw = resultado.alternativas ?? resultado.ideas ?? [];
    const alimentosPorNombre = new Map(
      catalogoAlimentos.map((alimento) => [
        normalizarTexto(alimento.nombre),
        alimento,
      ]),
    );
    const alimentosPorId = new Map(
      catalogoAlimentos.map((alimento) => [alimento.idAlimento, alimento]),
    );

    const alternativas: Omit<AlternativaGenerada, 'idTemp' | 'warnings'>[] =
      alternativasRaw.flatMap((idea) => {
        const alimentos = (idea.alimentos ?? []).map((a) => {
          const alimentoNombre = a.alimentoNombre ?? a.nombre ?? '';
          const clavesBusqueda =
            this.obtenerClavesBusquedaAlimento(alimentoNombre);
          const alimentoCatalogoPorNombre = clavesBusqueda.reduce<
            AlimentoOrmEntity | undefined
          >(
            (encontrado, clave) => encontrado ?? alimentosPorNombre.get(clave),
            undefined,
          );
          const alimentoCatalogo =
            clavesBusqueda.length > 0
              ? alimentoCatalogoPorNombre
              : typeof a.alimentoId === 'number'
                ? alimentosPorId.get(a.alimentoId)
                : undefined;
          const alimentoId = alimentoCatalogo?.idAlimento ?? 0;
          const nombreResuelto = alimentoCatalogo?.nombre ?? alimentoNombre;

          return {
            alimentoId,
            cantidad: a.cantidad ?? 0,
            unidad: a.unidad ?? 'g',
            alimentoNombre: nombreResuelto,
            nombre: nombreResuelto,
          };
        });

        const tieneAlimentosSinCatalogo = alimentos.some(
          (alimento) => alimento.alimentoId <= 0,
        );
        if (alimentos.length === 0 || tieneAlimentosSinCatalogo) {
          this.logger.warn(
            `Idea descartada porque no se pudieron resolver alimentos del catalogo: ${idea.nombre ?? 'Sin nombre'}`,
          );
          return [];
        }

        return [
          {
            nombre: idea.nombre ?? 'Sin nombre',
            alimentos,
            calorias: idea.calorias ?? 0,
            proteinas: idea.proteinas ?? 0,
            carbohidratos: idea.carbohidratos ?? 0,
            grasas: idea.grasas ?? 0,
            etiquetas: [],
          },
        ];
      });

    return { prompt: promptCompleto, alternativas };
  }

  private obtenerClavesBusquedaAlimento(nombre: string): string[] {
    const normalizado = normalizarTexto(nombre);
    if (!normalizado) return [];

    const sinonimos: Record<string, string> = {
      platano: 'banana',
      platanos: 'banana',
    };
    const claves = [normalizado];
    const sinonimo = sinonimos[normalizado];
    if (sinonimo) claves.push(sinonimo);
    if (normalizado.endsWith('es')) claves.push(normalizado.slice(0, -2));
    if (normalizado.endsWith('s')) claves.push(normalizado.slice(0, -1));

    return [...new Set(claves)];
  }

  private obtenerNombre(valor: unknown): string {
    if (typeof valor === 'string') return valor;
    if (typeof valor === 'object' && valor !== null && 'nombre' in valor) {
      const nombre = (valor as { nombre?: unknown }).nombre;
      return typeof nombre === 'string' ? nombre : '';
    }

    return '';
  }
}
