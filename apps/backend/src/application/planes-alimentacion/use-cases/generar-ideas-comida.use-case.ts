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
  GrupoAlimenticioOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
  PreparacionOrmEntity,
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
import { ResolvedorCatalogoIA } from 'src/application/ia/services/resolvedor-catalogo-ia.service';
import { CreadorPreparacionesIA } from 'src/application/ia/services/creador-preparaciones-ia.service';
import type { AlimentoNuevoDto } from 'src/application/ai/dto/alimento-nuevo.dto';
import { BloqueoGeneracionPlanIaService } from '../services/bloqueo-generacion-plan-ia.service';

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
  preparacionId?: number;
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

interface AlimentoNuevoRaw {
  nombre: string;
  categoriaNombre: string;
  cantidadBase: number;
  unidadBase: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

const MAX_REINTENTOS_IA = 3;
const MAX_TOKENS_IDEAS_COMIDA = 4096;

interface RespuestaRawIdeasComida {
  ideas?: AlternativaRaw[];
  alternativas?: AlternativaRaw[];
  advertencias?: string[];
  alimentosNuevos?: AlimentoNuevoRaw[];
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
    alimentosNuevos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          categoriaNombre: { type: 'string' },
          cantidadBase: { type: 'number' },
          unidadBase: { type: 'string' },
          calorias: { type: 'number' },
          proteinas: { type: 'number' },
          carbohidratos: { type: 'number' },
          grasas: { type: 'number' },
        },
        required: [
          'nombre',
          'categoriaNombre',
          'cantidadBase',
          'unidadBase',
          'calorias',
          'proteinas',
          'carbohidratos',
          'grasas',
        ],
      },
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
    @InjectRepository(GrupoAlimenticioOrmEntity)
    private readonly grupoAlimenticioRepo: Repository<GrupoAlimenticioOrmEntity>,
    @InjectRepository(PreparacionOrmEntity)
    private readonly preparacionRepo: Repository<PreparacionOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepo: NutricionistaRepository,
    @Inject(SOCIO_REPOSITORY)
    private readonly _socioRepo: SocioRepository,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly _planVersionRepo: PlanAlimentacionVersionRepository,
    private readonly tenantContext: TenantContextService,
    private readonly restriccionesValidator: RestriccionesValidator,
    private readonly resolvedorCatalogoIA: ResolvedorCatalogoIA,
    private readonly creadorPreparacionesIA: CreadorPreparacionesIA,
    private readonly bloqueoGeneracionPlanIa: BloqueoGeneracionPlanIaService,
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

    await this.bloqueoGeneracionPlanIa.verificarSinGeneracionActiva({
      socioId,
      gimnasioId: user.gimnasioId,
      planAlimentacionId: dto.planAlimentacionId,
    });

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

    // Cargar categorías una sola vez al inicio
    const categoriasExistentes = await this.grupoAlimenticioRepo.find({
      select: { idGrupoAlimenticio: true, descripcion: true },
    });

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
        categoriasExistentes,
        user.gimnasioId,
        plan.nutricionista?.idPersona ?? user.personaId,
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
    categoriasExistentes: { idGrupoAlimenticio: number; descripcion: string }[],
    gimnasioId: number,
    nutricionistaId: number,
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

    // Recargar catálogo en cada iteración para ver alimentos creados en iteraciones previas
    const catalogoAlimentos = await this.alimentoRepo.find({
      select: { idAlimento: true, nombre: true },
      order: { nombre: 'ASC' },
    });

    const categoriasNombres = categoriasExistentes.map((c) => c.descripcion);

    const { system, user } = this.promptBuilder.build({
      ficha: fichaInput,
      slot: { dia: dto.dia, tipoComida: dto.tipoComida },
      cantidad,
      alimentosDisponibles: catalogoAlimentos.map(
        (alimento) => alimento.nombre,
      ),
      categoriasGruposAlimenticios: categoriasNombres,
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
      return { prompt: promptCompleto, alternativas: [] };
    }

    const alternativasRaw = resultado.alternativas ?? resultado.ideas ?? [];
    const alimentosNuevosRaw = resultado.alimentosNuevos ?? [];

    // Extraer todos los nombres de alimentos usados
    const nombresUsados = alternativasRaw.flatMap((idea) =>
      (idea.alimentos ?? []).map((a) => a.alimentoNombre ?? a.nombre ?? ''),
    );

    let mapaNombresAIds: Map<string, number>;

    try {
      const resultadoResolucion = await this.resolvedorCatalogoIA.resolver(
        nombresUsados,
        alimentosNuevosRaw as AlimentoNuevoDto[],
        catalogoAlimentos,
        categoriasExistentes,
      );
      mapaNombresAIds = resultadoResolucion.mapa;
      if (resultadoResolucion.creados.length > 0) {
        this.logger.log(
          `Alimentos creados por IA en ideas-comida: ${resultadoResolucion.creados.map((c) => c.nombre).join(', ')}`,
        );
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `ResolvedorCatalogoIA falló en ideas-comida: ${mensaje}. Descartando alternativas de esta iteración.`,
      );
      return { prompt: promptCompleto, alternativas: [] };
    }

    // Construir mapa por nombre original para reescribir
    const alternativas: Omit<AlternativaGenerada, 'idTemp' | 'warnings'>[] =
      alternativasRaw.flatMap((idea) => {
        const alimentosResueltos = (idea.alimentos ?? []).map((a) => {
          const nombreOriginal = a.alimentoNombre ?? a.nombre ?? '';
          const alimentoId = mapaNombresAIds.get(nombreOriginal) ?? 0;
          return {
            alimentoId,
            cantidad: a.cantidad ?? 0,
            unidad: a.unidad ?? 'g',
            alimentoNombre: nombreOriginal,
            nombre: nombreOriginal,
          };
        });

        if (alimentosResueltos.length === 0) {
          return [];
        }

        const nombreResolved = this.resolverNombreAlternativa(
          idea.nombre,
          alimentosResueltos,
          dto.tipoComida,
        );

        return [
          {
            nombre: nombreResolved,
            alimentos: alimentosResueltos,
            calorias: idea.calorias ?? 0,
            proteinas: idea.proteinas ?? 0,
            carbohidratos: idea.carbohidratos ?? 0,
            grasas: idea.grasas ?? 0,
            etiquetas: [],
          },
        ];
      });

    // Crear Preparaciones para alternativas con 2+ alimentos
    if (alternativas.length > 0 && gimnasioId && nutricionistaId) {
      const alternativasParaPreparacion = alternativas.map((alt) => ({
        nombre: alt.nombre,
        alimentos: alt.alimentos.map((a) => ({
          alimentoId: a.alimentoId,
          cantidad: a.cantidad,
          unidad: a.unidad,
        })),
      }));

      try {
        const resultadosPrep = await this.creadorPreparacionesIA.obtenerOCrear(
          alternativasParaPreparacion,
          gimnasioId,
          nutricionistaId,
        );

        for (const alt of alternativas) {
          const resultadoPrep = resultadosPrep.get(alt.nombre);
          if (resultadoPrep) {
            alt.preparacionId = resultadoPrep.preparacionId;
          }
        }
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `CreadorPreparacionesIA falló en ideas-comida: ${mensaje}. Continuando sin preparaciones.`,
        );
      }
    }

    return { prompt: promptCompleto, alternativas };
  }

  private resolverNombreAlternativa(
    nombre: string | undefined,
    alimentos: Array<{ alimentoNombre: string }>,
    tipoComida: TipoComida,
  ): string {
    const nombreActual = nombre?.trim() || 'Sin nombre';
    if (!this.esNombreGenerico(nombreActual, tipoComida)) {
      return nombreActual;
    }

    const nombresAlimentos = alimentos
      .map((alimento) => alimento.alimentoNombre.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (nombresAlimentos.length === 0) return nombreActual;
    if (nombresAlimentos.length === 1) return nombresAlimentos[0];

    const [principal, ...resto] = nombresAlimentos;
    return `${principal} con ${resto.join(' y ')}`;
  }

  private esNombreGenerico(nombre: string, tipoComida: TipoComida): boolean {
    const normalizado = normalizarTexto(nombre);
    const tipoNormalizado = normalizarTexto(tipoComida);
    const numerosGenericos =
      '(\\d+|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)';

    return [tipoNormalizado, 'alternativa', 'opcion', 'idea'].some((prefijo) =>
      new RegExp(`^${prefijo} ${numerosGenericos}$`).test(normalizado),
    );
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
