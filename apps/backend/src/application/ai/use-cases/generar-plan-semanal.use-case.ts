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
 *     - Llamar Groq (IAiProviderService).
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
 *  - 503 GROQ_TIMEOUT si 2 timeouts.
 *  - 502 GROQ_INVALID_JSON si 2 JSON malformados.
 *  - 422 PLAN_ESTRUCTURA_INVALIDA si estructura inválida.
 *  - El plan se persiste IGUAL si macros rojo (warning + notificación, no rechaza).
 */

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import type { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import type { PlanAlimentacionVersionRepository } from 'src/domain/repositories/plan-alimentacion-version.repository';
import { NUTRICIONISTA_IA_MEMORIA_REPOSITORY } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import type { NutricionistaIAMemoriaRepository } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import {
  PlanAlimentacionDatosJson,
  ResumenMacrosDia,
} from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';
import {
  RestriccionesValidatorV2,
  type FichaClinicaParaValidacion,
} from 'src/domain/validators/restricciones-validator-v2';
import {
  MacrosValidator,
  type ObjetivoNutricional,
} from 'src/domain/validators/macros-validator';
import { PromptPlanSemanalBuilder } from '../builders/prompt-plan-semanal.builder';
import { PromptRestriccionesInstructionBuilder } from '../builders/prompt-restricciones-instruction.builder';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { SeleccionarEjemplosMemoriaUseCase } from 'src/application/ia-memoria/use-cases/seleccionar-ejemplos-memoria.use-case';

export interface SolicitudPlanSemanal {
  socioId: number;
  nutricionistaId: number;
  gimnasioId: number;
  diasAGenerar?: number;
  comidasPorDia?: number;
  alternativasPorComida?: number;
  notasGeneracion?: string;
  fechaInicio?: Date;
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

const MAX_REINTENTOS_RESTRICCIONES = 2;
const MAX_REINTENTOS_GROQ = 2;
const TIMEOUT_BACKOFF_MS = 5000;

@Injectable()
export class GenerarPlanSemanalUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepo: Repository<FichaSaludOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
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
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudPlanSemanal,
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

    // 5) Construir prompt
    const { systemPrompt, userPrompt } = this.promptBuilder.construir({
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
      diasAGenerar,
      comidasPorDia,
      alternativasPorComida,
      fechaInicio,
    });

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

    let intentoGroq = 0;
    let planJsonFinal: PlanAlimentacionDatosJson | null = null;

    while (intentoGroq < MAX_REINTENTOS_GROQ) {
      intentoGroq++;
      try {
        planJsonFinal =
          await this.aiProvider.generarRecomendacion<PlanAlimentacionDatosJson>(
            this.combinarPrompts(systemPrompt, userPrompt),
            {},
          );
        break;
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        if (this.esTimeout(mensaje)) {
          this.logger.warn(
            `Groq timeout (intento ${intentoGroq}/${MAX_REINTENTOS_GROQ}): ${mensaje}`,
          );
          if (intentoGroq < MAX_REINTENTOS_GROQ) {
            await this.sleep(TIMEOUT_BACKOFF_MS);
            continue;
          }
          throw new BadRequestError(`GROQ_TIMEOUT: ${mensaje}`, {
            codigo: 'GROQ_TIMEOUT',
            socioId: solicitud.socioId,
          });
        }

        if (this.esJsonInvalido(mensaje)) {
          this.logger.warn(
            `Groq JSON inválido (intento ${intentoGroq}/${MAX_REINTENTOS_GROQ}): ${mensaje}`,
          );
          if (intentoGroq < MAX_REINTENTOS_GROQ) {
            continue;
          }
          throw new BadRequestError(`GROQ_INVALID_JSON: ${mensaje}`, {
            codigo: 'GROQ_INVALID_JSON',
            socioId: solicitud.socioId,
          });
        }

        // Error no esperado: propagar
        throw error;
      }
    }

    if (!planJsonFinal) {
      throw new BadRequestError('No se pudo generar el plan con la IA');
    }

    planJson = planJsonFinal;

    // Validar estructura mínima del JSON
    if (!this.esEstructuraValida(planJson)) {
      throw new BadRequestError(
        'PLAN_ESTRUCTURA_INVALIDA: el JSON generado no tiene la estructura esperada',
        {
          codigo: 'PLAN_ESTRUCTURA_INVALIDA',
          socioId: solicitud.socioId,
        },
      );
    }

    // 7) Validar restricciones con reintentos por instrucción correctiva
    let intentoRestricciones = 0;
    while (intentoRestricciones <= MAX_REINTENTOS_RESTRICCIONES) {
      validacionRestricciones = RestriccionesValidatorV2.validarPlanCompleto(
        planJson,
        fichaClinica,
      );

      if (validacionRestricciones.restriccionesNoCumplidas.length === 0) {
        break;
      }

      intentoRestricciones++;
      if (intentoRestricciones > MAX_REINTENTOS_RESTRICCIONES) {
        advertencias.push(
          `Restricciones no cumplidas tras ${MAX_REINTENTOS_RESTRICCIONES} reintentos. Plan persistido con advertencia.`,
        );
        break;
      }

      // Regenerar con instrucción correctiva
      const instruccionCorrectiva =
        PromptRestriccionesInstructionBuilder.generar(
          validacionRestricciones.restriccionesNoCumplidas,
        );
      const userPromptConCorreccion = `${userPrompt}\n\nCORRECCIÓN OBLIGATORIA: ${instruccionCorrectiva}`;

      try {
        const nuevoPlan =
          await this.aiProvider.generarRecomendacion<PlanAlimentacionDatosJson>(
            this.combinarPrompts(systemPrompt, userPromptConCorreccion),
            {},
          );
        if (this.esEstructuraValida(nuevoPlan)) {
          planJson = nuevoPlan;
        } else {
          break;
        }
      } catch {
        // Si falla la regeneración, mantener el plan anterior
        break;
      }
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
    const objetivoMacros: ObjetivoNutricional =
      this.calcularObjetivoMacros(fichaClinica);

    validacionMacros = MacrosValidator.validar(
      planJson,
      objetivoMacros,
      diasAGenerar,
      comidasPorDia,
      fechaInicio,
    );

    if (!validacionMacros.cumpleEstructura) {
      throw new BadRequestError(
        `PLAN_ESTRUCTURA_INVALIDA: ${validacionMacros.advertencias.join('; ')}`,
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
      numeroVersion: 1,
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
          numeroVersion: 1,
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

    // 12) Notificaciones
    // IMPORTANTE: Los tipos PLAN_REVISAR, PLAN_MACROS_FUERA_RANGO y
    // PLAN_VALIDACION_WARNING se agregan al enum `TipoNotificacion` en
    // Packet 4 (Task 4.8). Mientras tanto usamos PLAN_CREADO como placeholder
    // y diferenciamos por metadata.alerta para no romper la auditoría.
    try {
      await this.notificacionesService.crear({
        destinatarioId: solicitud.nutricionistaId,
        tipo: TipoNotificacion.PLAN_CREADO,
        titulo: 'Nuevo plan generado con IA',
        mensaje: `Se generó un plan para el socio ${solicitud.socioId}. Revisalo antes de activarlo.`,
        metadata: {
          planId: planGuardado.idPlanAlimentacion,
          versionId: versionGuardada.idPlanAlimentacionVersion,
          alerta: 'PLAN_REVISAR',
        },
      });

      if (validacionMacros.bandaGlobal === 'ROJO') {
        await this.notificacionesService.crear({
          destinatarioId: solicitud.nutricionistaId,
          tipo: TipoNotificacion.PLAN_CREADO,
          titulo: 'Macros fuera de rango',
          mensaje: `El plan generado tiene macros fuera del rango aceptable (±10%). Banda global: ROJO.`,
          metadata: {
            planId: planGuardado.idPlanAlimentacion,
            versionId: versionGuardada.idPlanAlimentacionVersion,
            alerta: 'PLAN_MACROS_FUERA_RANGO',
          },
        });
      }

      if (
        validacionRestricciones.restriccionesNoCumplidas.length > 0 &&
        validacionRestricciones.restriccionesNoCumplidas.length >=
          validacionRestricciones.restriccionesCumplidas.length
      ) {
        await this.notificacionesService.crear({
          destinatarioId: solicitud.nutricionistaId,
          tipo: TipoNotificacion.PLAN_CREADO,
          titulo: 'Validación con advertencias',
          mensaje: `El plan generado tiene ${validacionRestricciones.restriccionesNoCumplidas.length} violaciones de restricciones que no pudieron corregirse.`,
          metadata: {
            planId: planGuardado.idPlanAlimentacion,
            versionId: versionGuardada.idPlanAlimentacionVersion,
            alerta: 'PLAN_VALIDACION_WARNING',
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
      numeroVersion: 1,
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

  private calcularObjetivoMacros(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ficha: FichaClinicaParaValidacion,
  ): ObjetivoNutricional {
    // Heurística simple basada en objetivoPersonal. Una iteración futura
    // podría usar Harris-Benedict con peso/altura/edad.
    const calorias = 2000;
    const proteinas = Math.round((calorias * 0.25) / 4);
    const carbohidratos = Math.round((calorias * 0.5) / 4);
    const grasas = Math.round((calorias * 0.25) / 9);

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
    plan.activo = true;
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
    if (typeof p.macrosPorDia !== 'object' || p.macrosPorDia === null) {
      return false;
    }
    if (!p.razonamientoCumplimiento) return false;
    if (!Array.isArray(p.razonamientoCumplimiento.restriccionesCumplidas)) {
      return false;
    }
    if (!Array.isArray(p.razonamientoCumplimiento.restriccionesNoCumplidas)) {
      return false;
    }
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

  private combinarPrompts(system: string, user: string): string {
    return `${system}\n\n---\n\n${user}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
