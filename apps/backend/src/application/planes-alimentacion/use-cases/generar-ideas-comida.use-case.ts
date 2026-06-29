import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import {
  FichaSaludOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import type { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { SOCIO_REPOSITORY } from 'src/domain/entities/Persona/Socio/socio.repository';
import type { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
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
import { BadRequestError, ForbiddenError, NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

export interface AlternativaGenerada {
  idTemp: string;
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    alimentoNombre: string;
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
  }>;
  calorias?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
}

/** Alternativa sin los campos generados automáticamente */
interface AlternativaParaValidar {
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    alimentoNombre: string;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  etiquetas: string[];
}

const MAX_REINTENTOS_IA = 3;

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
      throw new NotFoundError('Plan de alimentación', String(dto.planAlimentacionId));
    }

    // Auth: el NUT debe ser dueño del plan o ser ADMIN
    const esDueno =
      plan.nutricionista?.idPersona === user.personaId;
    const esAdmin = user.rol === 'ADMIN';
    if (!esDueno && !esAdmin) {
      throw new ForbiddenError('No tenés permisos sobre este plan.');
    }

    const ficha = await this.fichaRepo.findOne({
      where: { socio: { idPersona: plan.socio.idPersona } as any },
    });

    if (!ficha) {
      throw new BadRequestError(
        'El paciente no tiene ficha de salud. Completala antes de generar ideas.',
      );
    }

    // Loop con reintentos: hasta que la salida pase el filtro
    const alternativasValidadas: AlternativaGenerada[] = [];
    let intento = 0;
    let ultimaRespuestaIA: Omit<AlternativaGenerada, 'idTemp' | 'warnings'>[] = [];
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
      ultimaRespuestaIA = alternativasRaw.alternativas;

      for (const alt of alternativasRaw.alternativas) {
        const validacion = this.restriccionesValidator.validarAlternativa(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ficha as any,
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
      alergias: ficha.alergias?.map((a) => a.nombre) ?? [],
      restriccionesAlimentarias: ficha.restriccionesAlimentarias ?? null,
      patologias: ficha.patologias?.map((p) => p.nombre).filter(Boolean) ?? [],
      medicacionActual: ficha.medicacionActual ?? null,
      suplementosActuales: ficha.suplementosActuales ?? null,
    };

    const { system, user } = this.promptBuilder.build({
      ficha: fichaInput,
      slot: { dia: dto.dia, tipoComida: dto.tipoComida },
      cantidad,
    });

    const promptCompleto = `${system}\n\n---\n\n${user}`;

    // Llamar al AI provider y parsear la respuesta JSON
    let resultado: { ideas?: AlternativaRaw[] } = {};
    try {
      resultado = await this.aiProvider.generarRecomendacion<{
        ideas?: AlternativaRaw[];
      }>(promptCompleto, {
        temperature: 0.4,
        max_tokens: 1024,
        timeoutMs: 30000,
      });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI provider error en generarUnaPasada: ${mensaje}`);
      // No lanzar — devolvemos vacío y el loop seguirá
      return { prompt: promptCompleto, alternativas: [] };
    }

    const alternativasRaw = resultado.ideas ?? [];

    const alternativas: Omit<AlternativaGenerada, 'idTemp' | 'warnings'>[] =
      alternativasRaw.map((idea) => ({
        nombre: idea.nombre ?? 'Sin nombre',
        alimentos: (idea.alimentos ?? []).map((a) => ({
          alimentoId: a.alimentoId ?? 0,
          cantidad: a.cantidad ?? 0,
          unidad: a.unidad ?? 'g',
          alimentoNombre: a.alimentoNombre ?? '',
        })),
        calorias: idea.calorias ?? 0,
        proteinas: idea.proteinas ?? 0,
        carbohidratos: idea.carbohidratos ?? 0,
        grasas: idea.grasas ?? 0,
        etiquetas: [],
      }));

    return { prompt: promptCompleto, alternativas };
  }
}
