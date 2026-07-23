/**
 * GenerarPlanSemanalUseCase (REESCRITO — plan-alimentacion-ia-v2)
 * ===============================================================
 *
 * Flujo completo:
 *  1) Validar parámetros (rangos, presencia).
 *  2) Cargar ficha clínica del socio (Repository<FichaSaludOrmEntity>).
 *  3) Cargar nutricionista con preferencias_ia (NUTRICIONISTA_REPOSITORY).
 *  4) Cargar memoria IA (NutricionistaIAMemoriaRepository).
 *  5) Construir prompt via PromptPlanSemanalBuilder.
 *  6) Loop de generación con reintentos:
 *     - Llamar al proveedor IA configurado (IAiProviderService).
 *     - Si timeout → retry 1 con backoff 5s. Si falla → throw 503.
 *     - Si JSON malformado → retry 1 con temp 0.3 (manejado por GroqService).
 *     - Validar restricciones (RestriccionesValidatorV2). Si violación
 *       → instrucción correctiva y retry (max 2).
 *     - Validar coherencia razonamiento (regenerar si incoherente).
 *  7) Validar macros (MacrosValidator):
 *     - Si estructura inválida → throw 422.
 *     - Si macros rojo → notificar PLAN_MACROS_FUERA_RANGO.
 *  8) Persistir en transacción:
 *     - INSERT plan_alimentacion (estado BORRADOR).
 *     - INSERT plan_alimentacion_version v1 (motivo='creacion_inicial').
 *  9) Auditoría: PLAN_CREADO.
 * 10) Notificación: PLAN_REVISAR al nutricionista.
 *
 * Errores:
 *  - 503 AI_PROVIDER_TIMEOUT si 2 timeouts.
 *  - 502 AI_PROVIDER_INVALID_JSON si 2 JSON malformados.
 *  - 422 PLAN_ESTRUCTURA_INVALIDA si estructura inválida.
 *  - El plan se persiste IGUAL si macros rojo (warning + notificación, no rechaza).
 */

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadGatewayError,
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import type { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import type { PlanAlimentacionVersionRepository } from 'src/domain/repositories/plan-alimentacion-version.repository';
import { NUTRICIONISTA_IA_MEMORIA_REPOSITORY } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import type { NutricionistaIAMemoriaRepository } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import {
  NutricionistaOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import {
  PlanAlimentacionDatosJson,
  ResumenMacrosDia,
} from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import {
  RestriccionesValidatorV2,
  type FichaClinicaParaValidacion,
} from 'src/domain/validators/restricciones-validator-v2';
import {
  MacrosValidator,
  type ObjetivoNutricional,
} from 'src/domain/validators/macros-validator';
import {
  PromptPlanSemanalBuilder,
  type ContextoPromptPlanSemanal,
} from '../builders/prompt-plan-semanal.builder';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { SeleccionarEjemplosMemoriaUseCase } from 'src/application/ia-memoria/use-cases/seleccionar-ejemplos-memoria.use-case';
import { ResolvedorCatalogoIA } from 'src/application/ia/services/resolvedor-catalogo-ia.service';
import { CreadorPreparacionesIA } from 'src/application/ia/services/creador-preparaciones-ia.service';
import { RotadorProteinasService } from 'src/application/ia/services/rotador-proteinas.service';
import type { AlimentoNuevoDto } from 'src/application/ai/dto/alimento-nuevo.dto';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { PreparacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/preparacion.entity';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

/**
 * Representa el JSON crudo devuelto por la IA antes de resolver
 * el catálogo de alimentos. Incluye campos adicionales que la IA
 * injecta (alimentoNombre, alimentosNuevos) y que el dominio
 * no conoce en su tipo PlanAlimentacionDatosJson.
 */
interface PlanSemanalRawJson extends PlanAlimentacionDatosJson {
  alimentosNuevos?: AlimentoNuevoDto[];

  alimentos?: any[];
}

interface ComidaGeneradaJson {
  comida: ComidaPlanGenerada;
  alimentosNuevos?: AlimentoNuevoDto[];
}

export interface SolicitudPlanSemanal {
  socioId: number;
  nutricionistaId: number;
  gimnasioId: number;
  diasAGenerar?: number;
  comidasPorDia?: number;
  alternativasPorComida?: number;
  notasGeneracion?: string;
  fechaInicio?: Date;
  caloriasLimite?: number;
  proteinasEstimadas?: number;
  carbohidratosEstimados?: number;
  grasasEstimados?: number;
  alimentosPreferidos?: string[];
  alimentosEvitados?: string[];
}

export interface RespuestaPlanSemanal {
  planAlimentacionId: number;
  versionId: number;
  numeroVersion: number;
  plan: PlanAlimentacionDatosJson;
  validacion: ReturnType<typeof RestriccionesValidatorV2.validarPlanCompleto>;
  macros: ReturnType<typeof MacrosValidator.validar>;
  advertencias: string[];
}

const MAX_REINTENTOS_PROVEEDOR_IA = 2;
const MAX_REINTENTOS_ESTRUCTURA = 2;
const MAX_REINTENTOS_CATALOGO = 2;
const TIMEOUT_BACKOFF_MS = 5000;
const TEMPERATURA_PLAN_COMPLETO = 0.4;
const MAX_TOKENS_PLAN_COMPLETO = 8192;
const TIMEOUT_PLAN_COMPLETO_MS = 120000;
// Cada comida es una llamada IA independiente. Generar 4 en paralelo reduce
// el tiempo total (~28 comidas) sin saturar el proveedor. Si subís este valor
// y empezás a ver rate limits del proveedor, bajalo de nuevo.
const CONCURRENCIA_GENERACION_COMIDAS = 4;

const DIAS_GENERACION: DiaSemana[] = [
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
  DiaSemana.DOMINGO,
];

const TIPOS_COMIDA_GENERACION: TipoComida[] = [
  TipoComida.DESAYUNO,
  TipoComida.ALMUERZO,
  TipoComida.MERIENDA,
  TipoComida.CENA,
  TipoComida.COLACION,
];

type ValidacionMacrosPlan = ReturnType<typeof MacrosValidator.validar>;

interface ResultadoGeneracionCompleta {
  planJson: PlanAlimentacionDatosJson;
  validacionMacros: ValidacionMacrosPlan;
}

type DiaPlanGenerado = PlanAlimentacionDatosJson['estructura'][number];
type ComidaPlanGenerada = DiaPlanGenerado['comidas'][number];

interface SnapshotParcialPlanIa {
  estructura: PlanAlimentacionDatosJson['estructura'];
}

export interface ProgresoGeneracionPlanIa {
  dia: DiaSemana;
  tipoComida: TipoComida;
  comidasGeneradas: number;
  comidasTotales: number;
  snapshotParcial: SnapshotParcialPlanIa;
}

interface OpcionesGeneracionPlanSemanal {
  onProgreso?: (progreso: ProgresoGeneracionPlanIa) => Promise<void> | void;
}

@Injectable()
export class GenerarPlanSemanalUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepo: Repository<FichaSaludOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @InjectRepository(GrupoAlimenticioOrmEntity)
    private readonly grupoAlimenticioRepo: Repository<GrupoAlimenticioOrmEntity>,
    @InjectRepository(PreparacionOrmEntity)
    private readonly preparacionRepo: Repository<PreparacionOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepo: NutricionistaRepository,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    @Inject(NUTRICIONISTA_IA_MEMORIA_REPOSITORY)
    private readonly memoriaRepo: NutricionistaIAMemoriaRepository,
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    private readonly promptBuilder: PromptPlanSemanalBuilder,
    private readonly seleccionarEjemplosMemoriaUseCase: SeleccionarEjemplosMemoriaUseCase,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly resolvedorCatalogoIA: ResolvedorCatalogoIA,
    private readonly creadorPreparacionesIA: CreadorPreparacionesIA,
    private readonly rotadorProteinas: RotadorProteinasService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudPlanSemanal,
    opciones: OpcionesGeneracionPlanSemanal = {},
  ): Promise<RespuestaPlanSemanal> {
    const inicioMs = Date.now();

    // 1) Validar parámetros
    const diasAGenerar = solicitud.diasAGenerar ?? 7;
    const comidasPorDia = solicitud.comidasPorDia ?? 4;
    const alternativasPorComida = solicitud.alternativasPorComida ?? 3;
    const fechaInicio = solicitud.fechaInicio ?? this.proximoLunesAR();
    const notasGeneracion = solicitud.notasGeneracion ?? null;

    this.validarParametros(
      diasAGenerar,
      comidasPorDia,
      alternativasPorComida,
      notasGeneracion,
    );

    // 2) Cargar ficha clínica del socio
    const fichaClinica = await this.cargarFichaClinica(solicitud.socioId);

    // 3) Cargar nutricionista
    const nutricionista = await this.nutricionistaRepo.findById(
      solicitud.nutricionistaId,
    );
    if (!nutricionista) {
      throw new NotFoundError(
        'Nutricionista',
        String(solicitud.nutricionistaId),
      );
    }

    // 4) Cargar memoria IA (1-3 ejemplos, scoring por keywords)
    const objetivoTexto = fichaClinica.objetivoPersonal ?? '';
    const restriccionesTexto = [
      ...(fichaClinica.alergias ?? []),
      ...(fichaClinica.restriccionesAlimentarias
        ? [fichaClinica.restriccionesAlimentarias]
        : []),
      ...(fichaClinica.patologias ?? []),
    ];
    const ejemplosMemoriaScore =
      await this.seleccionarEjemplosMemoriaUseCase.ejecutar({
        nutricionistaId: solicitud.nutricionistaId,
        contexto: {
          objetivoTexto,
          restricciones: restriccionesTexto,
        },
        cantidadMaxima: 3,
        repo: this.memoriaRepo,
      });
    const ejemplosMemoria = ejemplosMemoriaScore.map((e) => ({
      tipoEjemplo: e.tipoEjemplo,
      comentario: e.comentario,
    }));

    // Resolver / Crear Alimentos preferidos y evitados en BD si no existen
    const alimentosPreferidosCurados = await this.buscarOCrearAlimentos(
      solicitud.alimentosPreferidos,
    );
    const alimentosEvitadosCurados = await this.buscarOCrearAlimentos(
      solicitud.alimentosEvitados,
    );

    // 5) Contexto base para prompts diarios
    const contextoPromptBase = {
      fichaClinica: {
        alergias: fichaClinica.alergias,
        restriccionesAlimentarias: fichaClinica.restriccionesAlimentarias,
        patologias: fichaClinica.patologias,
        objetivoPersonal: fichaClinica.objetivoPersonal,
      },
      nutricionista: {
        preferenciasIa: nutricionista.preferenciasIa ?? null,
      },
      notasGeneracion,
      ejemplosMemoria,
      comidasPorDia,
      alternativasPorComida,
      fechaInicio,
      caloriasLimite: solicitud.caloriasLimite,
      proteinasEstimadas: solicitud.proteinasEstimadas,
      carbohidratosEstimados: solicitud.carbohidratosEstimados,
      grasasEstimados: solicitud.grasasEstimados,
      alimentosPreferidos: alimentosPreferidosCurados,
      alimentosEvitados: alimentosEvitadosCurados,
    };

    const objetivoMacros: ObjetivoNutricional = this.calcularObjetivoMacros(
      fichaClinica,
      solicitud,
    );

    // 6) Loop de generación con reintentos
    let planJson: PlanAlimentacionDatosJson | null = null;
    const advertencias: string[] = [];
    let validacionRestricciones: ReturnType<
      typeof RestriccionesValidatorV2.validarPlanCompleto
    > = {
      restriccionesCumplidas: [],
      restriccionesNoCumplidas: [],
      advertencias: [],
    };
    let validacionMacros: ReturnType<typeof MacrosValidator.validar> = {
      cumpleEstructura: false,
      diasFaltantes: [],
      comidasFaltantes: [],
      advertencias: [],
      macrosPorDia: {},
      bandaGlobal: 'VERDE',
      puedeAceptar: false,
    };

    const diasEsperados = this.obtenerDiasEsperados(diasAGenerar);
    const generacionCompleta = await this.generarPlanPorDiasConReintentos({
      contextoPromptBase,
      socioId: solicitud.socioId,
      diasEsperados,
      comidasPorDia,
      alternativasPorComida,
      fechaInicio,
      objetivoMacros,
      onProgreso: opciones.onProgreso,
    });
    planJson = generacionCompleta.planJson;
    validacionMacros = generacionCompleta.validacionMacros;

    // 6b) Resolver catálogo: extraer nombres → resolver a alimentoId + crear faltantes
    const catalogoExistente = await this.alimentoRepo.find({
      select: { idAlimento: true, nombre: true },
    });
    const categoriasExistentes = await this.grupoAlimenticioRepo.find({
      select: { idGrupoAlimenticio: true, descripcion: true },
    });

    let intentoCatalogo = 0;
    let planResolved = false;

    while (!planResolved && intentoCatalogo <= MAX_REINTENTOS_CATALOGO) {
      intentoCatalogo++;
      const nombresUsados = this.extraerNombresAlimentos(planJson);
      const alimentosNuevosRaw =
        (planJson as PlanSemanalRawJson).alimentosNuevos ?? [];
      const resultado = await this.resolvedorCatalogoIA.resolver(
        nombresUsados,
        alimentosNuevosRaw,
        catalogoExistente,
        categoriasExistentes,
      );
      planJson = this.reescribirSnapshotConIds(planJson, resultado.mapa);
      if (resultado.creados.length > 0) {
        this.logger.log(
          `Alimentos creados por IA: ${resultado.creados.map((c) => c.nombre).join(', ')}`,
        );
      }
      planResolved = true;
    }

    if (!planResolved) {
      throw new BadRequestError(
        'No se pudo resolver el catálogo de alimentos tras reintentos.',
      );
    }

    // 7) Validar restricciones. No regeneramos el plan completo acá: esa llamada
    // vuelve a pedir un JSON semanal gigante y fue la fuente del truncamiento.
    validacionRestricciones = RestriccionesValidatorV2.validarPlanCompleto(
      planJson,
      fichaClinica,
    );
    if (validacionRestricciones.restriccionesNoCumplidas.length > 0) {
      advertencias.push(
        `El plan tiene ${validacionRestricciones.restriccionesNoCumplidas.length} restricción(es) no cumplidas. Se persiste con advertencia para revisión del nutricionista.`,
      );
    }

    // 8) Cross-check de razonamiento
    if (planJson.razonamientoCumplimiento) {
      const coherencia = RestriccionesValidatorV2.validarCoherenciaRazonamiento(
        planJson.razonamientoCumplimiento,
        validacionRestricciones,
      );
      if (!coherencia.coherente) {
        this.logger.warn(
          `Razonamiento incoherente: ${coherencia.contradicciones.length} contradicciones`,
        );
        advertencias.push(
          `El razonamiento de la IA tiene ${coherencia.contradicciones.length} contradicciones con la validación.`,
        );
      }
    }

    // 9) Validar macros
    validacionMacros = MacrosValidator.validar(
      planJson,
      objetivoMacros,
      diasEsperados.length,
      comidasPorDia,
      fechaInicio,
    );

    planJson = {
      ...planJson,
      macrosPorDia: this.construirMacrosPorDia(validacionMacros.macrosPorDia),
    };

    const advertenciasEstructuraFinal = this.obtenerAdvertenciasEstructura(
      planJson,
      diasEsperados,
      comidasPorDia,
      alternativasPorComida,
    );

    if (advertenciasEstructuraFinal.length > 0) {
      throw new BadRequestError(
        `PLAN_ESTRUCTURA_INVALIDA: ${advertenciasEstructuraFinal.join('; ')}`,
        {
          codigo: 'PLAN_ESTRUCTURA_INVALIDA',
          socioId: solicitud.socioId,
        },
      );
    }

    if (validacionMacros.bandaGlobal === 'ROJO') {
      advertencias.push(
        'El plan tiene macros fuera de rango (±10%). Se persiste con notificación al nutricionista.',
      );
    }

    // 10) Persistir (transacción manual: plan + version)
    const planGuardado = await this.planRepo.save(
      this.construirPlanEntity(solicitud, planJson),
    );
    const versionGuardada = await this.planVersionRepo.crear({
      idPlanAlimentacion: planGuardado.idPlanAlimentacion,
      numeroVersion: 0,
      datosJson: planJson,
      motivoCambio: 'creacion_inicial',
      activa: false,
      createdBy: solicitud.nutricionistaId,
    });

    // 11) Auditoría PLAN_CREADO (tolerante a fallos)
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.PLAN_CREADO,
        entidad: 'PlanAlimentacion',
        entidadId: planGuardado.idPlanAlimentacion,
        usuarioId: solicitud.nutricionistaId,
        gimnasioId: solicitud.gimnasioId,
        metadata: {
          versionId: versionGuardada.idPlanAlimentacionVersion,
          numeroVersion: 0,
          modo: 'IA',
          bandaGlobal: validacionMacros.bandaGlobal,
          restriccionesCumplidas:
            validacionRestricciones.restriccionesCumplidas.length,
          restriccionesNoCumplidas:
            validacionRestricciones.restriccionesNoCumplidas.length,
          duracionMs: Date.now() - inicioMs,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Auditoria PLAN_CREADO falló (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 12) Notificaciones (Packet 4: usar tipos correctos del enum)
    try {
      // 12a) Siempre: PLAN_REVISAR al NUT dueño
      await this.notificacionesService.crear({
        destinatarioId: solicitud.nutricionistaId,
        tipo: TipoNotificacion.PLAN_REVISAR,
        titulo: 'Nuevo plan generado con IA',
        mensaje: `Se generó un plan para el socio ${solicitud.socioId}. Revisalo antes de activarlo.`,
        metadata: {
          planId: planGuardado.idPlanAlimentacion,
          versionId: versionGuardada.idPlanAlimentacionVersion,
        },
      });

      // 12b) PLAN_MACROS_FUERA_RANGO si banda ROJO
      if (validacionMacros.bandaGlobal === 'ROJO') {
        await this.notificacionesService.crear({
          destinatarioId: solicitud.nutricionistaId,
          tipo: TipoNotificacion.PLAN_MACROS_FUERA_RANGO,
          titulo: 'Macros fuera de rango',
          mensaje: `El plan generado tiene macros fuera del rango aceptable (±10%). Banda global: ROJO.`,
          metadata: {
            planId: planGuardado.idPlanAlimentacion,
            versionId: versionGuardada.idPlanAlimentacionVersion,
            bandaGlobal: validacionMacros.bandaGlobal,
          },
        });
      }

      // 12c) PLAN_VALIDACION_WARNING si restricciones no cumplidas >= cumplidas
      if (
        validacionRestricciones.restriccionesNoCumplidas.length > 0 &&
        validacionRestricciones.restriccionesNoCumplidas.length >=
          validacionRestricciones.restriccionesCumplidas.length
      ) {
        await this.notificacionesService.crear({
          destinatarioId: solicitud.nutricionistaId,
          tipo: TipoNotificacion.PLAN_VALIDACION_WARNING,
          titulo: 'Validación con advertencias',
          mensaje: `El plan generado tiene ${validacionRestricciones.restriccionesNoCumplidas.length} violaciones de restricciones que no pudieron corregirse.`,
          metadata: {
            planId: planGuardado.idPlanAlimentacion,
            versionId: versionGuardada.idPlanAlimentacionVersion,
            violaciones:
              validacionRestricciones.restriccionesNoCumplidas.length,
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Notificaciones fallaron (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.logger.log(
      `Plan IA generado: socio=${solicitud.socioId} planId=${planGuardado.idPlanAlimentacion} v${versionGuardada.numeroVersion} banda=${validacionMacros.bandaGlobal} duracionMs=${Date.now() - inicioMs}`,
    );

    return {
      planAlimentacionId: planGuardado.idPlanAlimentacion,
      versionId: versionGuardada.idPlanAlimentacionVersion,
      numeroVersion: 0,
      plan: planJson,
      validacion: validacionRestricciones,
      macros: validacionMacros,
      advertencias,
    };
  }

  // ========================================================================
  // HELPERS PRIVADOS
  // ========================================================================

  private validarParametros(
    diasAGenerar: number,
    comidasPorDia: number,
    alternativasPorComida: number,
    notasGeneracion: string | null,
  ): void {
    if (diasAGenerar < 1 || diasAGenerar > 14) {
      throw new BadRequestError(
        `diasAGenerar debe estar entre 1 y 14 (recibido: ${diasAGenerar})`,
      );
    }
    if (comidasPorDia < 1 || comidasPorDia > 5) {
      throw new BadRequestError(
        `comidasPorDia debe estar entre 1 y 5 (recibido: ${comidasPorDia})`,
      );
    }
    if (alternativasPorComida < 1 || alternativasPorComida > 5) {
      throw new BadRequestError(
        `alternativasPorComida debe estar entre 1 y 5 (recibido: ${alternativasPorComida})`,
      );
    }
    if (notasGeneracion && notasGeneracion.length > 1000) {
      throw new BadRequestError(
        `notasGeneracion excede el máximo de 1000 caracteres`,
      );
    }
  }

  private obtenerDiasEsperados(diasAGenerar: number): DiaSemana[] {
    return DIAS_GENERACION.slice(0, diasAGenerar);
  }

  private construirClaveComida(dia: DiaSemana, tipoComida: TipoComida): string {
    return `${dia}:${tipoComida}`;
  }

  private dividirObjetivoComida(
    objetivoDiario: number | undefined,
    comidasPorDia: number,
  ): number | undefined {
    return objetivoDiario === undefined
      ? undefined
      : Math.round(objetivoDiario / comidasPorDia);
  }

  private async cargarFichaClinica(
    socioId: number,
  ): Promise<FichaClinicaParaValidacion> {
    const ficha = await this.fichaSaludRepo.findOne({
      where: { socio: { idPersona: socioId } },
      relations: { alergias: true, patologias: true },
    });

    if (!ficha) {
      // Sin ficha: devolvemos ficha vacía. El plan se genera igual, sin
      // restricciones duras que validar.
      return {
        alergias: [],
        restriccionesAlimentarias: null,
        patologias: [],
        objetivoPersonal: null,
      };
    }

    return {
      alergias: ficha.alergias?.map((a) => a.nombre) ?? [],
      restriccionesAlimentarias: ficha.restriccionesAlimentarias ?? null,
      patologias:
        ficha.patologias?.map((p) => p.nombre).filter((p) => p.length > 0) ??
        [],
      objetivoPersonal: ficha.objetivoPersonal ?? null,
    };
  }

  private async generarPlanPorDiasConReintentos(params: {
    contextoPromptBase: Omit<
      ContextoPromptPlanSemanal,
      'diasAGenerar' | 'diasEspecificos'
    >;
    socioId: number;
    diasEsperados: DiaSemana[];
    comidasPorDia: number;
    alternativasPorComida: number;
    fechaInicio: Date;
    objetivoMacros: ObjetivoNutricional;
    onProgreso?: OpcionesGeneracionPlanSemanal['onProgreso'];
  }): Promise<ResultadoGeneracionCompleta> {
    const tiposComidaEsperados = TIPOS_COMIDA_GENERACION.slice(
      0,
      params.comidasPorDia,
    );
    const tareasGeneracion = params.diasEsperados.flatMap((dia) =>
      tiposComidaEsperados.map((tipoComida) => ({ dia, tipoComida })),
    );

    // Asignación determinística de proteína principal por {dia, tipoComida}
    // para evitar que la IA ancle la alternativa #1 en una sola proteína
    // (bug histórico: "Pollo grillado con quinoa" repetido 13 veces).
    // El mapa filtra el pool por alergias/restricciones/evitados del socio.
    const proteinasAsignadas = this.rotadorProteinas.asignar(
      tareasGeneracion,
      params.contextoPromptBase.fichaClinica,
      params.contextoPromptBase.alimentosEvitados ?? [],
    );

    type TareaGeneracionComida = (typeof tareasGeneracion)[number];
    type ResultadoGeneracionComida = {
      dia: DiaSemana;
      tipoComida: TipoComida;
      comidaGenerada: ComidaPlanGenerada;
      generacionComida: ComidaGeneradaJson;
    };
    type FalloGeneracionComida = TareaGeneracionComida & { error: unknown };

    const resultadosPorComida: ResultadoGeneracionComida[] = [];
    const fallosTimeoutPendientes: FalloGeneracionComida[] = [];

    const construirEstructuraParcial =
      (): PlanAlimentacionDatosJson['estructura'] =>
        params.diasEsperados.map((dia) => ({
          dia,
          comidas: tiposComidaEsperados.flatMap((tipoComida) => {
            const resultado = resultadosPorComida.find(
              (comidaGenerada) =>
                comidaGenerada.dia === dia &&
                comidaGenerada.tipoComida === tipoComida,
            );

            return resultado ? [resultado.comidaGenerada] : [];
          }),
        }));

    const generarTareaComida = async (
      { dia, tipoComida }: TareaGeneracionComida,
      maxIntentosProveedor = MAX_REINTENTOS_PROVEEDOR_IA,
      maxIntentosEstructura = MAX_REINTENTOS_ESTRUCTURA + 1,
    ): Promise<ResultadoGeneracionComida> => {
      const claveComida = this.construirClaveComida(dia, tipoComida);
      const proteinaAsignada = proteinasAsignadas.get(claveComida);
      const { systemPrompt, userPrompt } = this.promptBuilder.construirComida({
        ...params.contextoPromptBase,
        diasAGenerar: 1,
        diasEspecificos: [dia],
        comidasPorDia: 1,
        tiposComidaEspecificos: [tipoComida],
        caloriasLimite: this.dividirObjetivoComida(
          params.contextoPromptBase.caloriasLimite,
          params.comidasPorDia,
        ),
        proteinasEstimadas: this.dividirObjetivoComida(
          params.contextoPromptBase.proteinasEstimadas,
          params.comidasPorDia,
        ),
        carbohidratosEstimados: this.dividirObjetivoComida(
          params.contextoPromptBase.carbohidratosEstimados,
          params.comidasPorDia,
        ),
        grasasEstimados: this.dividirObjetivoComida(
          params.contextoPromptBase.grasasEstimados,
          params.comidasPorDia,
        ),
        ...(proteinaAsignada
          ? { proteinaPrincipalAsignada: proteinaAsignada }
          : {}),
      });

      const generacionComida = await this.generarComidaConReintentos({
        systemPrompt,
        userPrompt,
        socioId: params.socioId,
        dia,
        tipoComida,
        alternativasPorComida: params.alternativasPorComida,
        maxIntentosProveedor,
        maxIntentosEstructura,
      });

      return {
        dia,
        tipoComida,
        comidaGenerada: generacionComida.comida,
        generacionComida,
      };
    };

    let colaPersistenciaProgreso = Promise.resolve();
    const registrarResultado = async (
      resultado: ResultadoGeneracionComida,
    ): Promise<void> => {
      resultadosPorComida.push(resultado);
      const progreso: ProgresoGeneracionPlanIa = {
        dia: resultado.dia,
        tipoComida: resultado.tipoComida,
        comidasGeneradas: resultadosPorComida.length,
        comidasTotales: tareasGeneracion.length,
        snapshotParcial: {
          estructura: construirEstructuraParcial(),
        },
      };

      colaPersistenciaProgreso = colaPersistenciaProgreso.then(async () => {
        await params.onProgreso?.(progreso);
      });
      await colaPersistenciaProgreso;
    };

    const ejecutarLote = async (
      loteComidas: readonly TareaGeneracionComida[],
      maxIntentosProveedor = MAX_REINTENTOS_PROVEEDOR_IA,
      maxIntentosEstructura = MAX_REINTENTOS_ESTRUCTURA + 1,
    ): Promise<FalloGeneracionComida[]> => {
      let falloPersistenciaProgreso = false;
      let errorPersistenciaProgreso: unknown;
      const fallos = await Promise.all(
        loteComidas.map(async (tarea) => {
          let resultado: ResultadoGeneracionComida;
          try {
            resultado = await generarTareaComida(
              tarea,
              maxIntentosProveedor,
              maxIntentosEstructura,
            );
          } catch (error: unknown) {
            return { ...tarea, error };
          }

          try {
            await registrarResultado(resultado);
          } catch (error: unknown) {
            if (!falloPersistenciaProgreso) {
              falloPersistenciaProgreso = true;
              errorPersistenciaProgreso = error;
            }
          }
          return null;
        }),
      );

      if (falloPersistenciaProgreso) {
        throw errorPersistenciaProgreso;
      }

      return fallos.flatMap((fallo) => (fallo ? [fallo] : []));
    };

    const relanzarFallo = (fallo: FalloGeneracionComida): never => {
      if (fallo.error instanceof Error) {
        throw fallo.error;
      }

      throw new BadGatewayError(
        `AI_PROVIDER_UPSTREAM_ERROR: no se pudo generar ${fallo.dia}/${fallo.tipoComida}`,
        {
          codigo: 'AI_PROVIDER_UPSTREAM_ERROR',
          socioId: params.socioId,
          dia: fallo.dia,
          tipoComida: fallo.tipoComida,
        },
      );
    };

    for (
      let i = 0;
      i < tareasGeneracion.length;
      i += CONCURRENCIA_GENERACION_COMIDAS
    ) {
      const loteComidas = tareasGeneracion.slice(
        i,
        i + CONCURRENCIA_GENERACION_COMIDAS,
      );
      const fallosLote = await ejecutarLote(loteComidas);
      if (fallosLote.length === 0) {
        continue;
      }

      const falloNoRecuperable = fallosLote.find((fallo) => {
        const mensaje =
          fallo.error instanceof Error
            ? fallo.error.message
            : String(fallo.error);
        return !this.esTimeout(mensaje);
      });
      if (falloNoRecuperable) {
        relanzarFallo(falloNoRecuperable);
      }

      if (fallosLote.length === loteComidas.length) {
        relanzarFallo(fallosLote[0]);
      }

      for (const fallo of fallosLote) {
        this.logger.warn(
          `Comida ${fallo.dia}/${fallo.tipoComida} agotó sus intentos por timeout; se reintentará al finalizar los lotes regulares.`,
        );
        fallosTimeoutPendientes.push(fallo);
      }
    }

    for (const falloPendiente of fallosTimeoutPendientes) {
      this.logger.warn(
        `Reintentando comida aislada ${falloPendiente.dia}/${falloPendiente.tipoComida}.`,
      );
      const fallosRecuperacion = await ejecutarLote([falloPendiente], 1, 1);
      if (fallosRecuperacion.length > 0) {
        relanzarFallo(fallosRecuperacion[0]);
      }
    }

    const comidasPorClave = new Map<string, ComidaPlanGenerada>();
    const alimentosNuevosPorNombre = new Map<string, AlimentoNuevoDto>();
    for (const resultado of resultadosPorComida) {
      comidasPorClave.set(
        this.construirClaveComida(resultado.dia, resultado.tipoComida),
        resultado.comidaGenerada,
      );

      for (const alimentoNuevo of resultado.generacionComida.alimentosNuevos ??
        []) {
        alimentosNuevosPorNombre.set(
          alimentoNuevo.nombre.trim().toLowerCase(),
          alimentoNuevo,
        );
      }
    }

    const estructura: DiaPlanGenerado[] = params.diasEsperados.map((dia) => ({
      dia,
      comidas: tiposComidaEsperados.map((tipoComida) => {
        const comida = comidasPorClave.get(
          this.construirClaveComida(dia, tipoComida),
        );
        if (!comida) {
          throw new BadRequestError(
            `PLAN_ESTRUCTURA_INVALIDA: falta ${dia}/${tipoComida} tras ensamblar el plan`,
            { codigo: 'PLAN_ESTRUCTURA_INVALIDA', socioId: params.socioId },
          );
        }
        return comida;
      }),
    }));

    const alimentosNuevos = [...alimentosNuevosPorNombre.values()];
    const planJson: PlanSemanalRawJson = {
      estructura,
      macrosPorDia: {} as PlanAlimentacionDatosJson['macrosPorDia'],
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
      ...(alimentosNuevos.length > 0 ? { alimentosNuevos } : {}),
    };

    const validacionMacros = MacrosValidator.validar(
      planJson,
      params.objetivoMacros,
      params.diasEsperados.length,
      params.comidasPorDia,
      params.fechaInicio,
    );
    const advertenciasEstructura = this.obtenerAdvertenciasEstructura(
      planJson,
      params.diasEsperados,
      params.comidasPorDia,
      params.alternativasPorComida,
      tiposComidaEsperados,
    );

    if (advertenciasEstructura.length > 0) {
      throw new BadRequestError(
        `PLAN_ESTRUCTURA_INVALIDA: ${advertenciasEstructura.join('; ')}`,
        { codigo: 'PLAN_ESTRUCTURA_INVALIDA', socioId: params.socioId },
      );
    }

    return { planJson, validacionMacros };
  }

  private async generarPlanCompletoConReintentos(params: {
    systemPrompt: string;
    userPrompt: string;
    socioId: number;
    diasEsperados: DiaSemana[];
    comidasPorDia: number;
    tiposComidaEsperados?: TipoComida[];
    alternativasPorComida: number;
    fechaInicio: Date;
    objetivoMacros: ObjetivoNutricional;
  }): Promise<ResultadoGeneracionCompleta> {
    let promptActual = this.combinarPrompts(
      params.systemPrompt,
      params.userPrompt,
    );

    for (
      let intentoEstructura = 1;
      intentoEstructura <= MAX_REINTENTOS_ESTRUCTURA + 1;
      intentoEstructura++
    ) {
      const planCandidato = await this.generarPlanConReintentosProveedorIa(
        promptActual,
        params.socioId,
      );

      if (!this.esEstructuraValida(planCandidato)) {
        const rawPreview =
          JSON.stringify(planCandidato)?.slice(0, 500) ?? String(planCandidato);
        const advertencias = [
          'el JSON generado no tiene la estructura mínima esperada',
        ];

        this.logger.error(
          `PLAN_ESTRUCTURA_INVALIDA para socio ${params.socioId}. Preview: ${rawPreview}`,
        );

        if (intentoEstructura > MAX_REINTENTOS_ESTRUCTURA) {
          throw new BadRequestError(
            `PLAN_ESTRUCTURA_INVALIDA: ${advertencias.join('; ')}`,
            {
              codigo: 'PLAN_ESTRUCTURA_INVALIDA',
              socioId: params.socioId,
            },
          );
        }

        promptActual = this.construirPromptCorreccionEstructura(
          params.systemPrompt,
          params.userPrompt,
          advertencias,
          params.diasEsperados,
          params.comidasPorDia,
          params.alternativasPorComida,
          params.tiposComidaEsperados,
        );
        continue;
      }

      const validacionMacros = MacrosValidator.validar(
        planCandidato,
        params.objetivoMacros,
        params.diasEsperados.length,
        params.comidasPorDia,
        params.fechaInicio,
      );
      const advertenciasEstructura = this.obtenerAdvertenciasEstructura(
        planCandidato,
        params.diasEsperados,
        params.comidasPorDia,
        params.alternativasPorComida,
        params.tiposComidaEsperados,
      );

      if (advertenciasEstructura.length === 0) {
        return { planJson: planCandidato, validacionMacros };
      }

      this.logger.warn(
        `Plan IA incompleto (intento ${intentoEstructura}/${MAX_REINTENTOS_ESTRUCTURA + 1}): ${advertenciasEstructura.join('; ')}`,
      );

      if (intentoEstructura > MAX_REINTENTOS_ESTRUCTURA) {
        throw new BadRequestError(
          `PLAN_ESTRUCTURA_INVALIDA: ${advertenciasEstructura.join('; ')}`,
          {
            codigo: 'PLAN_ESTRUCTURA_INVALIDA',
            socioId: params.socioId,
          },
        );
      }

      promptActual = this.construirPromptCorreccionEstructura(
        params.systemPrompt,
        params.userPrompt,
        advertenciasEstructura,
        params.diasEsperados,
        params.comidasPorDia,
        params.alternativasPorComida,
        params.tiposComidaEsperados,
      );
    }

    throw new BadRequestError('No se pudo generar el plan con la IA');
  }

  private async generarComidaConReintentos(params: {
    systemPrompt: string;
    userPrompt: string;
    socioId: number;
    dia: DiaSemana;
    tipoComida: TipoComida;
    alternativasPorComida: number;
    maxIntentosProveedor?: number;
    maxIntentosEstructura?: number;
  }): Promise<ComidaGeneradaJson> {
    const promptBase = this.combinarPrompts(
      params.systemPrompt,
      params.userPrompt,
    );
    let promptActual = promptBase;
    const maxIntentosEstructura =
      params.maxIntentosEstructura ?? MAX_REINTENTOS_ESTRUCTURA + 1;

    for (
      let intentoEstructura = 1;
      intentoEstructura <= maxIntentosEstructura;
      intentoEstructura++
    ) {
      const comidaCandidata = await this.generarComidaConReintentosProveedorIa(
        promptActual,
        params.socioId,
        params.dia,
        params.tipoComida,
        params.maxIntentosProveedor,
      );
      const advertencias = this.obtenerAdvertenciasComida(
        comidaCandidata,
        params.tipoComida,
        params.alternativasPorComida,
      );

      if (advertencias.length === 0) {
        return comidaCandidata;
      }

      this.logger.warn(
        `Comida IA incompleta ${params.dia}/${params.tipoComida} (intento ${intentoEstructura}/${maxIntentosEstructura}): ${advertencias.join('; ')}`,
      );

      if (intentoEstructura >= maxIntentosEstructura) {
        throw new BadRequestError(
          `PLAN_ESTRUCTURA_INVALIDA: ${advertencias.join('; ')}`,
          {
            codigo: 'PLAN_ESTRUCTURA_INVALIDA',
            socioId: params.socioId,
          },
        );
      }

      promptActual = `${promptBase}

CORRECCIÓN OBLIGATORIA:
La respuesta anterior NO cumple el contrato estructural:
- ${advertencias.join('\n- ')}

Devolvé nuevamente SOLO el JSON compacto de la comida ${params.tipoComida} para ${params.dia}.
Requisitos exactos:
- tipo: ${params.tipoComida}
- alternativas: ${params.alternativasPorComida}
- sin estructura semanal, sin macrosPorDia y sin razonamiento global.`;
    }

    throw new BadRequestError('No se pudo generar la comida con la IA');
  }

  private async generarPlanConReintentosProveedorIa(
    prompt: string,
    socioId: number,
  ): Promise<PlanAlimentacionDatosJson> {
    let intentoProveedor = 0;

    while (intentoProveedor < MAX_REINTENTOS_PROVEEDOR_IA) {
      intentoProveedor++;
      try {
        return await this.aiProvider.generarRecomendacion<PlanAlimentacionDatosJson>(
          prompt,
          {
            temperature: TEMPERATURA_PLAN_COMPLETO,
            max_tokens: MAX_TOKENS_PLAN_COMPLETO,
            timeoutMs: TIMEOUT_PLAN_COMPLETO_MS,
          },
        );
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        if (this.esTimeout(mensaje)) {
          this.logger.warn(
            `Proveedor IA timeout (intento ${intentoProveedor}/${MAX_REINTENTOS_PROVEEDOR_IA}): ${mensaje}`,
          );
          if (intentoProveedor < MAX_REINTENTOS_PROVEEDOR_IA) {
            await this.sleep(TIMEOUT_BACKOFF_MS);
            continue;
          }
          throw new ServiceUnavailableError(`AI_PROVIDER_TIMEOUT: ${mensaje}`, {
            codigo: 'AI_PROVIDER_TIMEOUT',
            socioId,
          });
        }

        if (this.esTruncacionDeterminista(mensaje)) {
          this.logger.warn(
            `Proveedor IA truncó respuesta (intento ${intentoProveedor}/${MAX_REINTENTOS_PROVEEDOR_IA}, no retry): ${mensaje}`,
          );
          throw new BadGatewayError(
            `AI_PROVIDER_TRUNCATED: ${mensaje}. Reducí alternativas o aumentá el límite de tokens.`,
            {
              codigo: 'AI_PROVIDER_TRUNCATED',
              socioId,
            },
          );
        }

        if (this.esJsonInvalido(mensaje)) {
          this.logger.warn(
            `Proveedor IA JSON inválido (intento ${intentoProveedor}/${MAX_REINTENTOS_PROVEEDOR_IA}): ${mensaje}`,
          );
          if (intentoProveedor < MAX_REINTENTOS_PROVEEDOR_IA) {
            continue;
          }
          throw new BadGatewayError(`AI_PROVIDER_INVALID_JSON: ${mensaje}`, {
            codigo: 'AI_PROVIDER_INVALID_JSON',
            socioId,
          });
        }

        this.logger.error(`Proveedor IA error no esperado: ${mensaje}`);
        throw new BadGatewayError(`AI_PROVIDER_UPSTREAM_ERROR: ${mensaje}`, {
          codigo: 'AI_PROVIDER_UPSTREAM_ERROR',
          socioId,
        });
      }
    }

    throw new BadRequestError('No se pudo generar el plan con la IA');
  }

  private async generarComidaConReintentosProveedorIa(
    prompt: string,
    socioId: number,
    dia: DiaSemana,
    tipoComida: TipoComida,
    maxIntentosProveedor = MAX_REINTENTOS_PROVEEDOR_IA,
  ): Promise<ComidaGeneradaJson> {
    let intentoProveedor = 0;

    while (intentoProveedor < maxIntentosProveedor) {
      intentoProveedor++;
      try {
        return await this.aiProvider.generarRecomendacion<ComidaGeneradaJson>(
          prompt,
          {
            temperature: TEMPERATURA_PLAN_COMPLETO,
            max_tokens: MAX_TOKENS_PLAN_COMPLETO,
            timeoutMs: TIMEOUT_PLAN_COMPLETO_MS,
          },
        );
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        if (this.esTimeout(mensaje)) {
          this.logger.warn(
            `Proveedor IA timeout generando comida (intento ${intentoProveedor}/${maxIntentosProveedor}): ${mensaje}`,
          );
          if (intentoProveedor < maxIntentosProveedor) {
            await this.sleep(TIMEOUT_BACKOFF_MS);
            continue;
          }
          throw new ServiceUnavailableError(
            `AI_PROVIDER_TIMEOUT (${dia}/${tipoComida}): ${mensaje}`,
            {
              codigo: 'AI_PROVIDER_TIMEOUT',
              socioId,
              dia,
              tipoComida,
            },
          );
        }

        if (this.esTruncacionDeterminista(mensaje)) {
          this.logger.warn(
            `Proveedor IA truncó respuesta generando comida (intento ${intentoProveedor}/${maxIntentosProveedor}, no retry): ${mensaje}`,
          );
          throw new BadGatewayError(
            `AI_PROVIDER_TRUNCATED: ${mensaje}. Reducí alternativas o aumentá el límite de tokens.`,
            {
              codigo: 'AI_PROVIDER_TRUNCATED',
              socioId,
              dia,
              tipoComida,
            },
          );
        }

        if (this.esJsonInvalido(mensaje)) {
          this.logger.warn(
            `Proveedor IA JSON inválido generando comida (intento ${intentoProveedor}/${maxIntentosProveedor}): ${mensaje}`,
          );
          if (intentoProveedor < maxIntentosProveedor) {
            continue;
          }
          throw new BadGatewayError(`AI_PROVIDER_INVALID_JSON: ${mensaje}`, {
            codigo: 'AI_PROVIDER_INVALID_JSON',
            socioId,
            dia,
            tipoComida,
          });
        }

        this.logger.error(
          `Proveedor IA error no esperado generando comida: ${mensaje}`,
        );
        throw new BadGatewayError(`AI_PROVIDER_UPSTREAM_ERROR: ${mensaje}`, {
          codigo: 'AI_PROVIDER_UPSTREAM_ERROR',
          socioId,
          dia,
          tipoComida,
        });
      }
    }

    throw new BadRequestError('No se pudo generar la comida con la IA');
  }

  private obtenerAdvertenciasComida(
    resultado: ComidaGeneradaJson,
    tipoComida: TipoComida,
    alternativasPorComida: number,
  ): string[] {
    const advertencias: string[] = [];

    if (!this.esComidaGeneradaValida(resultado)) {
      return ['el JSON generado no tiene la estructura mínima de comida'];
    }

    if (resultado.comida.tipo !== tipoComida) {
      advertencias.push(
        `tipo de comida inválido: ${resultado.comida.tipo}/${tipoComida}`,
      );
    }

    const cantidadAlternativas = resultado.comida.alternativas.length;
    if (cantidadAlternativas !== alternativasPorComida) {
      advertencias.push(
        `cantidad de alternativas inválida: ${cantidadAlternativas}/${alternativasPorComida}`,
      );
    }

    for (const alternativa of resultado.comida.alternativas) {
      if (alternativa.alimentos.length === 0) {
        advertencias.push(`alternativa sin alimentos: ${alternativa.nombre}`);
      }
    }

    return [...new Set(advertencias)];
  }

  private esComidaGeneradaValida(
    resultado: unknown,
  ): resultado is ComidaGeneradaJson {
    if (!resultado || typeof resultado !== 'object') return false;
    const comida = (resultado as { comida?: unknown }).comida;
    if (!comida || typeof comida !== 'object') return false;

    const comidaCandidata = comida as ComidaPlanGenerada;
    return (
      typeof comidaCandidata.tipo === 'string' &&
      Array.isArray(comidaCandidata.alternativas) &&
      comidaCandidata.alternativas.length > 0 &&
      comidaCandidata.alternativas.every(
        (alternativa) =>
          alternativa !== null &&
          typeof alternativa === 'object' &&
          typeof alternativa.nombre === 'string' &&
          Array.isArray(alternativa.alimentos) &&
          typeof alternativa.calorias === 'number' &&
          typeof alternativa.proteinas === 'number' &&
          typeof alternativa.carbohidratos === 'number' &&
          typeof alternativa.grasas === 'number',
      )
    );
  }

  private obtenerAdvertenciasEstructura(
    plan: PlanAlimentacionDatosJson,
    diasEsperados: DiaSemana[],
    comidasPorDia: number,
    alternativasPorComida: number,
    tiposComidaEsperados = TIPOS_COMIDA_GENERACION.slice(0, comidasPorDia),
  ): string[] {
    const advertencias: string[] = [];
    const diasPresentes = new Set(plan.estructura.map((dia) => dia.dia));
    const diasEsperadosSet = new Set(diasEsperados);

    const diasFaltantes = diasEsperados.filter(
      (dia) => !diasPresentes.has(dia),
    );
    if (diasFaltantes.length > 0) {
      advertencias.push(
        `Días faltantes en el plan: ${diasFaltantes.join(', ')}`,
      );
    }

    const diasExtra = plan.estructura
      .map((dia) => dia.dia)
      .filter((dia) => !diasEsperadosSet.has(dia));
    if (diasExtra.length > 0) {
      advertencias.push(
        `Días no solicitados en el plan: ${diasExtra.join(', ')}`,
      );
    }

    if (plan.estructura.length !== diasEsperados.length) {
      advertencias.push(
        `Cantidad de días inválida: ${plan.estructura.length}/${diasEsperados.length}`,
      );
    }

    for (const dia of plan.estructura) {
      const tiposPresentes = new Set(dia.comidas.map((comida) => comida.tipo));
      const comidasFaltantes = tiposComidaEsperados.filter(
        (tipo) => !tiposPresentes.has(tipo),
      );
      if (comidasFaltantes.length > 0) {
        advertencias.push(
          `comidas faltantes en ${dia.dia}: ${comidasFaltantes.join(', ')}`,
        );
      }

      const comidasExtra = dia.comidas
        .map((comida) => comida.tipo)
        .filter((tipo) => !tiposComidaEsperados.includes(tipo));
      if (comidasExtra.length > 0) {
        advertencias.push(
          `comidas no solicitadas en ${dia.dia}: ${comidasExtra.join(', ')}`,
        );
      }

      if (dia.comidas.length !== comidasPorDia) {
        advertencias.push(
          `Cantidad de comidas inválida en ${dia.dia}: ${dia.comidas.length}/${comidasPorDia}`,
        );
      }

      for (const comida of dia.comidas) {
        const cantidadAlternativas = comida.alternativas.length;
        if (cantidadAlternativas < alternativasPorComida) {
          advertencias.push(
            `alternativas faltantes en ${dia.dia}/${comida.tipo}: ${cantidadAlternativas}/${alternativasPorComida}`,
          );
        }
        if (cantidadAlternativas > alternativasPorComida) {
          advertencias.push(
            `alternativas excedentes en ${dia.dia}/${comida.tipo}: ${cantidadAlternativas}/${alternativasPorComida}`,
          );
        }
      }
    }

    return [...new Set(advertencias)];
  }

  private construirPromptCorreccionEstructura(
    systemPrompt: string,
    userPrompt: string,
    advertencias: string[],
    diasEsperados: DiaSemana[],
    comidasPorDia: number,
    alternativasPorComida: number,
    tiposComidaEsperados = TIPOS_COMIDA_GENERACION.slice(0, comidasPorDia),
  ): string {
    const userPromptCorregido = `${userPrompt}

CORRECCIÓN OBLIGATORIA:
La respuesta anterior NO cumple el contrato estructural:
- ${advertencias.join('\n- ')}

Devolvé nuevamente el plan COMPLETO desde cero.
Requisitos exactos:
- ${diasEsperados.length} días completos: ${diasEsperados.join(', ')}.
- ${comidasPorDia} comidas por día.
- Tipos exactos de comida: ${tiposComidaEsperados.join(', ')}.
- ${alternativasPorComida} alternativas por comida.
No omitas días, comidas ni alternativas aunque el JSON sea largo.`;

    return this.combinarPrompts(systemPrompt, userPromptCorregido);
  }

  private construirMacrosPorDia(
    macrosCalculados: ValidacionMacrosPlan['macrosPorDia'],
  ): PlanAlimentacionDatosJson['macrosPorDia'] {
    const macrosPorDia: Partial<Record<DiaSemana, ResumenMacrosDia>> = {};

    for (const [dia, resumen] of Object.entries(macrosCalculados) as Array<
      [DiaSemana, ResumenMacrosDia]
    >) {
      macrosPorDia[dia] = {
        calorias: resumen.calorias,
        proteinas: resumen.proteinas,
        carbohidratos: resumen.carbohidratos,
        grasas: resumen.grasas,
      };
    }

    return macrosPorDia as PlanAlimentacionDatosJson['macrosPorDia'];
  }

  private calcularObjetivoMacros(
    ficha: FichaClinicaParaValidacion,
    solicitud: SolicitudPlanSemanal,
  ): ObjetivoNutricional {
    // Heurística simple basada en objetivoPersonal. Si hay valores específicos
    // en la solicitud, se usan de forma prioritaria.
    const calorias = solicitud.caloriasLimite ?? 2000;
    const proteinas =
      solicitud.proteinasEstimadas ?? Math.round((calorias * 0.25) / 4);
    const carbohidratos =
      solicitud.carbohidratosEstimados ?? Math.round((calorias * 0.5) / 4);
    const grasas =
      solicitud.grasasEstimados ?? Math.round((calorias * 0.25) / 9);

    return {
      caloriasDiarias: calorias,
      proteinasDiarias: proteinas,
      carbohidratosDiarios: carbohidratos,
      grasasDiarias: grasas,
    };
  }

  private construirPlanEntity(
    solicitud: SolicitudPlanSemanal,
    planJson: PlanAlimentacionDatosJson,
  ): PlanAlimentacionOrmEntity {
    const plan = new PlanAlimentacionOrmEntity();
    plan.fechaCreacion = new Date();
    plan.objetivoNutricional = `Plan IA - ${planJson.estructura.length} días`;
    plan.socio = { idPersona: solicitud.socioId } as SocioOrmEntity;
    plan.nutricionista = {
      idPersona: solicitud.nutricionistaId,
    } as NutricionistaOrmEntity;
    // Hotfix Packet 8: NO setear `activo` ni `estado` explícitamente.
    // Los defaults de la entidad (activo=false, estado='BORRADOR')
    // aplican. La activación la maneja `ActivarPlanAlimentacionUseCase`.
    plan.eliminadoEn = null;
    plan.motivoEliminacion = null;
    plan.motivoEdicion = null;
    plan.ultimaEdicion = null;
    plan.notasGeneracion = solicitud.notasGeneracion ?? null;
    return plan;
  }

  private esEstructuraValida(plan: unknown): plan is PlanAlimentacionDatosJson {
    if (!plan || typeof plan !== 'object') return false;
    const p = plan as PlanAlimentacionDatosJson;
    if (!Array.isArray(p.estructura)) return false;

    // Log para debug: ver qué devolvió la IA
    this.logger.warn(
      `Plan JSON validación: estructura=${p.estructura.length} días, tieneMacros=${!!p.macrosPorDia}, tieneRazonamiento=${!!p.razonamientoCumplimiento}`,
    );

    // macrosPorDia y razonamientoCumplimiento son opcionales —
    // el plan se puede generar sin ellos y se completan con defaults
    // Cada elemento de estructura debe tener dia + comidas (array con al menos 1)
    return p.estructura.every(
      (d) =>
        typeof d.dia === 'string' &&
        Array.isArray(d.comidas) &&
        d.comidas.length > 0 &&
        d.comidas.every(
          (c) =>
            typeof c.tipo === 'string' &&
            Array.isArray(c.alternativas) &&
            c.alternativas.length > 0,
        ),
    );
  }

  private esTimeout(mensaje: string): boolean {
    const lower = mensaje.toLowerCase();
    return (
      lower.includes('timeout') ||
      lower.includes('timed out') ||
      lower.includes('etimedout') ||
      lower.includes('aborted')
    );
  }

  private esJsonInvalido(mensaje: string): boolean {
    const lower = mensaje.toLowerCase();
    return (
      lower.includes('json') ||
      lower.includes('parse') ||
      lower.includes('unexpected token')
    );
  }

  /**
   * La truncación por finish_reason=length es determinista para el mismo
   * prompt+máximo de tokens: reintentar con el mismo setup vuelve a truncar.
   * Solo reintentamos si el mensaje NO contiene el marcador explícito de
   * truncación (que sí indica un fallo no recuperable del prompt actual).
   */
  private esTruncacionDeterminista(mensaje: string): boolean {
    const lower = mensaje.toLowerCase();
    return (
      lower.includes('truncado') ||
      lower.includes('finish_reason=length') ||
      (lower.includes('length') && lower.includes('max_tokens'))
    );
  }

  private combinarPrompts(system: string, user: string): string {
    return `${system}\n\n---\n\n${user}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extraerNombresAlimentos(plan: PlanAlimentacionDatosJson): string[] {
    const nombres = new Set<string>();
    for (const dia of plan.estructura) {
      for (const comida of dia.comidas) {
        for (const alternativa of comida.alternativas) {
          for (const alimento of alternativa.alimentos) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const nombre = (alimento as any).alimentoNombre as
              | string
              | undefined;
            if (nombre) {
              nombres.add(nombre);
            }
          }
        }
      }
    }
    return [...nombres];
  }

  private reescribirSnapshotConIds(
    plan: PlanAlimentacionDatosJson,
    mapa: Map<string, number>,
  ): PlanAlimentacionDatosJson {
    return {
      ...plan,
      estructura: plan.estructura.map((dia) => ({
        ...dia,
        comidas: dia.comidas.map((comida) => ({
          ...comida,
          alternativas: comida.alternativas.map((alt) => ({
            ...alt,
            alimentos: alt.alimentos.map((al) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              const alimentoNombre = (al as any).alimentoNombre as
                | string
                | undefined;
              return {
                ...al,
                alimentoId: mapa.get(alimentoNombre ?? '') ?? al.alimentoId,
                nombre: alimentoNombre ?? al.nombre,
              };
            }),
          })),
        })),
      })),
    };
  }

  private async buscarOCrearAlimentos(nombres?: string[]): Promise<string[]> {
    if (!nombres || nombres.length === 0) {
      return [];
    }

    const nombresNormalizados = nombres
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    const nombresUnicos = [...new Set(nombresNormalizados)];

    const resultados: string[] = [];

    for (const nombre of nombresUnicos) {
      const normalizado = nombre.toLowerCase().trim();

      let alimento = await this.alimentoRepo
        .createQueryBuilder('alimento')
        .where('LOWER(alimento.nombre) = :nombre', { nombre: normalizado })
        .getOne();

      if (!alimento) {
        const nuevoAlimento = this.alimentoRepo.create({
          nombre: nombre.trim(),
          cantidad: 100,
          unidadMedida: UnidadMedida.GRAMO,
        });
        alimento = await this.alimentoRepo.save(nuevoAlimento);
      }

      resultados.push(alimento.nombre);
    }

    return resultados;
  }

  private proximoLunesAR(): Date {
    const hoy = new Date();
    const diaSemana = hoy.getUTCDay(); // 0=domingo, 1=lunes
    const diffLunes = diaSemana === 0 ? 1 : 8 - diaSemana;
    const lunes = new Date(hoy);
    lunes.setUTCDate(hoy.getUTCDate() + diffLunes);
    lunes.setUTCHours(0, 0, 0, 0);
    return lunes;
  }
}

// Re-export del tipo de resumen de macros para uso externo
export type { ResumenMacrosDia };
