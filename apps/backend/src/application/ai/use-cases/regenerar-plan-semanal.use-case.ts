/**
 * RegenerarPlanSemanalUseCase
 * ===========================
 *
 * Regenera un subconjunto de un plan de alimentación existente usando IA.
 * Tres scopes:
 *  - PLAN:        reemplaza la estructura completa del plan.
 *  - DIA:         reemplaza las comidas de un único día (preserva el resto).
 *  - ALTERNATIVA: reemplaza una sola alternativa (preserva el resto).
 *
 * Flujo:
 *  1) Validar versión existe (404), plan no finalizado (409), NUT dueño (403).
 *  2) Validar scope específico (DIA requiere `dia`, ALTERNATIVA requiere
 *     `dia` + `comidaSlot` + `alternativaIndex`).
 *  3) Si la versión actual es `edicion_manual`, exigir
 *     `confirmarPerdidaEdicionManual=true` o rechazar (409).
 *  4) Cargar ficha clínica + nutricionista + memoria IA (few-shot).
 *  5) Construir sub-prompt con preserved context via PromptRegeneracionBuilder.
 *  6) Llamar Groq (temp 0.7, max_tokens 2048 — más corto que generación completa).
 *  7) Validar estructura del JSON devuelto.
 *  8) Merge quirúrgico en datosJson (reemplaza solo la porción scope-specific).
 *  9) Re-validar restricciones + macros sobre el plan MERGEADO.
 *  10) Persistir nueva PlanAlimentacionVersion con numeroVersion+1,
 *      motivoCambio=scope-specific, activa=false.
 *  11) Notificaciones:
 *      - PLAN_REVISAR siempre (al NUT dueño).
 *      - PLAN_VALIDACION_WARNING si restricciones no cumplidas (no se reintenta).
 *      - PLAN_MACROS_FUERA_RANGO si macros en banda ROJO.
 *  12) Auditoría: PLAN_REGENERADO.
 *
 * Errores:
 *  - 400 BadRequest si falta campo scope-específico.
 *  - 403 Forbidden si NUT no es dueño.
 *  - 404 NotFound si versión o plan no existen.
 *  - 409 Conflict si plan FINALIZADO, si versión no pertenece al plan, o
 *    si es edicion_manual sin confirmación.
 *  - 422 UnprocessableEntity si estructura mergeada inválida.
 *  - 502 BadGateway si JSON IA inválido.
 *  - 503 ServiceUnavailable si Groq timeout.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
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
import {
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
  PlanAlimentacionVersionRepository,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import {
  NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
  NutricionistaIAMemoriaRepository,
} from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import {
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
  PlanAlimentacionVersionOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import {
  PlanAlimentacionDatosJson,
  MotivoCambio,
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
import { PromptRegeneracionBuilder } from '../builders/prompt-regeneracion.builder';
import type { ScopeRegeneracion } from '../builders/prompt-regeneracion.builder';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { SeleccionarEjemplosMemoriaUseCase } from 'src/application/ia-memoria/use-cases/seleccionar-ejemplos-memoria.use-case';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

export interface SolicitudRegenerarPlan {
  planAlimentacionVersionId: number;
  nutricionistaUserId: number;
  gimnasioId: number;
  scope: ScopeRegeneracion;
  dia?: DiaSemana;
  comidaSlot?: TipoComida;
  alternativaIndex?: number;
  notasGeneracion?: string | null;
  confirmarPerdidaEdicionManual?: boolean;
}

export interface RespuestaRegenerarPlan {
  planAlimentacionId: number;
  versionAnteriorId: number;
  versionNuevaId: number;
  numeroVersionNuevo: number;
  plan: PlanAlimentacionDatosJson;
  motivoCambio: MotivoCambio;
  validacion: ReturnType<typeof RestriccionesValidatorV2.validarPlanCompleto>;
  macros: ReturnType<typeof MacrosValidator.validar>;
}

const MAX_REINTENTOS_GROQ = 2;
const TIMEOUT_BACKOFF_MS = 5000;
const TEMPERATURE_REGENERACION = 0.7;
const MAX_TOKENS_REGENERACION = 2048;

@Injectable()
export class RegenerarPlanSemanalUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepo: Repository<FichaSaludOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepo: Repository<NutricionistaOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepo: NutricionistaRepository,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    @Inject(NUTRICIONISTA_IA_MEMORIA_REPOSITORY)
    private readonly memoriaRepo: NutricionistaIAMemoriaRepository,
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    private readonly promptBuilder: PromptRegeneracionBuilder,
    private readonly seleccionarEjemplosMemoriaUseCase: SeleccionarEjemplosMemoriaUseCase,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
    private readonly dataSource: DataSource,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(solicitud: SolicitudRegenerarPlan): Promise<RespuestaRegenerarPlan> {
    const inicioMs = Date.now();
    // 0) Validar scope y campos scope-específicos ANTES de tocar la BD.
    //    Esto garantiza que un 400 se devuelve antes que un 404 si la
    //    combinación scope+campos es inválida.
    this.validarParametros(solicitud);
    if (solicitud.scope === 'DIA' && !solicitud.dia) {
      throw new BadRequestError(
        'scope=DIA requiere el campo `dia` (LUNES, MARTES, etc.)',
      );
    }
    if (solicitud.scope === 'ALTERNATIVA') {
      if (!solicitud.dia) {
        throw new BadRequestError(
          'scope=ALTERNATIVA requiere el campo `dia`',
        );
      }
      if (!solicitud.comidaSlot) {
        throw new BadRequestError(
          'scope=ALTERNATIVA requiere el campo `comidaSlot` (DESAYUNO, ALMUERZO, etc.)',
        );
      }
      if (
        solicitud.alternativaIndex === undefined ||
        solicitud.alternativaIndex === null ||
        solicitud.alternativaIndex < 0
      ) {
        throw new BadRequestError(
          'scope=ALTERNATIVA requiere el campo `alternativaIndex` (>= 0)',
        );
      }
    }

    // 1) Cargar versión
    const versionActual = await this.planVersionRepo.obtenerPorId(
      solicitud.planAlimentacionVersionId,
    );
    if (!versionActual) {
      throw new NotFoundError(
        'Versión de plan',
        String(solicitud.planAlimentacionVersionId),
      );
    }

    // 2) Cargar plan padre con socio/nutricionista
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: versionActual.idPlanAlimentacion },
      relations: { socio: true, nutricionista: true },
    });
    if (!plan) {
      throw new NotFoundError(
        'Plan de alimentación',
        String(versionActual.idPlanAlimentacion),
      );
    }

    // 3) Multi-tenant check
    if (
      plan.socio &&
      (plan.socio as unknown as { gimnasioId: number | null }).gimnasioId !==
        this.tenantContext.gimnasioId
    ) {
      throw new ForbiddenError('La versión pertenece a otro gimnasio');
    }

    // 4) Plan FINALIZADO → no se puede regenerar
    if (plan.estado === 'FINALIZADO') {
      throw new ConflictError(
        'PLAN_FINALIZADO: el plan está finalizado y no admite regeneraciones',
      );
    }

    // 5) Validar NUT dueño
    if (
      (plan.nutricionista as unknown as { idPersona: number | null })
        .idPersona !== solicitud.nutricionistaUserId
    ) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño del plan puede regenerar versiones',
      );
    }

    // 6) Validar que la versión pertenece al plan (defensa en profundidad)
    if (versionActual.idPlanAlimentacion !== plan.idPlanAlimentacion) {
      throw new ConflictError(
        'La versión indicada no pertenece al plan solicitado',
      );
    }

    // 7) Validar índice de alternativa contra la estructura actual
    if (solicitud.scope === 'ALTERNATIVA' && solicitud.dia && solicitud.comidaSlot) {
      this.validarIndiceAlternativa(
        versionActual.datosJson,
        solicitud.dia,
        solicitud.comidaSlot,
        solicitud.alternativaIndex!,
      );
    }

    // 8) Validar edicion_manual + flag de confirmación
    if (
      versionActual.motivoCambio === 'edicion_manual' &&
      !solicitud.confirmarPerdidaEdicionManual
    ) {
      throw new ConflictError(
        'EDICION_MANUAL_SIN_CONFIRMAR: la versión actual fue editada manualmente. Para regenerarla enviá `confirmarPerdidaEdicionManual: true`.',
      );
    }

    // 10) Cargar ficha clínica del socio
    const fichaClinica = await this.cargarFichaClinica(
      (plan.socio as unknown as { idPersona: number | null }).idPersona!,
    );

    // 11) Cargar nutricionista (preferences_ia)
    const nutricionista = await this.nutricionistaRepo.findById(
      solicitud.nutricionistaUserId,
    );
    if (!nutricionista) {
      throw new NotFoundError(
        'Nutricionista',
        String(solicitud.nutricionistaUserId),
      );
    }

    // 12) Cargar memoria IA (1-3 ejemplos)
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
        nutricionistaId: solicitud.nutricionistaUserId,
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

    // 13) Construir sub-prompt
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
      notasGeneracion: solicitud.notasGeneracion ?? null,
      ejemplosMemoria,
      versionActual: versionActual.datosJson,
      scope: solicitud.scope,
      dia: solicitud.dia,
      comidaSlot: solicitud.comidaSlot,
      alternativaIndex: solicitud.alternativaIndex,
    });

    // 14) Llamar Groq con reintentos
    let planJsonGenerado: PlanAlimentacionDatosJson | null = null;
    let intentoGroq = 0;

    while (intentoGroq < MAX_REINTENTOS_GROQ) {
      intentoGroq++;
      try {
        planJsonGenerado =
          await this.aiProvider.generarRecomendacion<PlanAlimentacionDatosJson>(
            `${systemPrompt}\n\n---\n\n${userPrompt}`,
            { temperature: TEMPERATURE_REGENERACION, max_tokens: MAX_TOKENS_REGENERACION },
          );
        break;
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        if (this.esTimeout(mensaje)) {
          this.logger.warn(
            `Groq timeout en regeneración (intento ${intentoGroq}/${MAX_REINTENTOS_GROQ}): ${mensaje}`,
          );
          if (intentoGroq < MAX_REINTENTOS_GROQ) {
            await this.sleep(TIMEOUT_BACKOFF_MS);
            continue;
          }
          throw new BadRequestError(`GROQ_TIMEOUT: ${mensaje}`, {
            codigo: 'GROQ_TIMEOUT',
            versionId: solicitud.planAlimentacionVersionId,
          });
        }
        if (this.esJsonInvalido(mensaje)) {
          this.logger.warn(
            `Groq JSON inválido en regeneración (intento ${intentoGroq}/${MAX_REINTENTOS_GROQ}): ${mensaje}`,
          );
          if (intentoGroq < MAX_REINTENTOS_GROQ) {
            continue;
          }
          throw new BadRequestError(`GROQ_INVALID_JSON: ${mensaje}`, {
            codigo: 'GROQ_INVALID_JSON',
            versionId: solicitud.planAlimentacionVersionId,
          });
        }
        throw error;
      }
    }

    if (!planJsonGenerado) {
      throw new BadRequestError('No se pudo regenerar el plan con la IA');
    }

    // 15) Validar estructura mínima del JSON
    if (!this.esEstructuraValida(planJsonGenerado)) {
      throw new BadRequestError(
        'PLAN_ESTRUCTURA_INVALIDA: el JSON regenerado no tiene la estructura esperada',
        {
          codigo: 'PLAN_ESTRUCTURA_INVALIDA',
          versionId: solicitud.planAlimentacionVersionId,
        },
      );
    }

    // 16) Merge quirúrgico en el plan actual
    const planMerged = this.aplicarMerge(
      versionActual.datosJson,
      planJsonGenerado,
      solicitud,
    );

    // 17) Re-validar restricciones sobre el plan mergeado
    const validacionRestricciones = RestriccionesValidatorV2.validarPlanCompleto(
      planMerged,
      fichaClinica,
    );

    // 18) Re-validar macros sobre el plan mergeado
    const objetivoMacros: ObjetivoNutricional =
      this.calcularObjetivoMacros(fichaClinica);
    const validacionMacros = MacrosValidator.validar(
      planMerged,
      objetivoMacros,
      planMerged.estructura.length,
      planMerged.estructura[0]?.comidas.length ?? 4,
      new Date(),
    );

    if (!validacionMacros.cumpleEstructura) {
      throw new BadRequestError(
        `PLAN_ESTRUCTURA_INVALIDA_POST_MERGE: ${validacionMacros.advertencias.join('; ')}`,
        {
          codigo: 'PLAN_ESTRUCTURA_INVALIDA',
          versionId: solicitud.planAlimentacionVersionId,
        },
      );
    }

    // 19) Persistir nueva versión (transacción para garantizar consistencia)
    const motivoCambio = this.mapearMotivoCambio(solicitud.scope);
    const numeroVersionNuevo = versionActual.numeroVersion + 1;

    const versionNueva = await this.dataSource.transaction(async (manager) => {
      const versionRepo = manager.getRepository(PlanAlimentacionVersionOrmEntity);
      const orm = versionRepo.create({
        idPlanAlimentacion: plan.idPlanAlimentacion,
        numeroVersion: numeroVersionNuevo,
        datosJson: planMerged,
        motivoCambio,
        activa: false,
        createdBy: solicitud.nutricionistaUserId,
      });
      const saved = await versionRepo.save(orm);
      return saved;
    });

    // 20) Notificaciones
    try {
      // 20a) Siempre: PLAN_REVISAR al NUT dueño
      await this.notificacionesService.crear({
        destinatarioId: solicitud.nutricionistaUserId,
        tipo: TipoNotificacion.PLAN_REVISAR,
        titulo: 'Versión regenerada con IA',
        mensaje: `Se regeneró ${
          solicitud.scope === 'PLAN'
            ? 'el plan completo'
            : solicitud.scope === 'DIA'
              ? `el día ${solicitud.dia}`
              : `la alternativa #${solicitud.alternativaIndex} del ${solicitud.dia} ${solicitud.comidaSlot}`
        }. Revisalo antes de activarlo.`,
        metadata: {
          planId: plan.idPlanAlimentacion,
          versionId: versionNueva.idPlanAlimentacionVersion,
          versionAnteriorId: versionActual.idPlanAlimentacionVersion,
          scope: solicitud.scope,
          motivoCambio,
        },
      });

      // 20b) PLAN_VALIDACION_WARNING si hay restricciones no cumplidas
      if (validacionRestricciones.restriccionesNoCumplidas.length > 0) {
        await this.notificacionesService.crear({
          destinatarioId: solicitud.nutricionistaUserId,
          tipo: TipoNotificacion.PLAN_VALIDACION_WARNING,
          titulo: 'Validación con advertencias',
          mensaje: `La versión regenerada tiene ${validacionRestricciones.restriccionesNoCumplidas.length} violación(es) de restricciones.`,
          metadata: {
            planId: plan.idPlanAlimentacion,
            versionId: versionNueva.idPlanAlimentacionVersion,
            violaciones: validacionRestricciones.restriccionesNoCumplidas.length,
          },
        });
      }

      // 20c) PLAN_MACROS_FUERA_RANGO si banda ROJO
      if (validacionMacros.bandaGlobal === 'ROJO') {
        await this.notificacionesService.crear({
          destinatarioId: solicitud.nutricionistaUserId,
          tipo: TipoNotificacion.PLAN_MACROS_FUERA_RANGO,
          titulo: 'Macros fuera de rango',
          mensaje: `La versión regenerada tiene macros fuera del rango aceptable (±10%). Banda global: ROJO.`,
          metadata: {
            planId: plan.idPlanAlimentacion,
            versionId: versionNueva.idPlanAlimentacionVersion,
            bandaGlobal: validacionMacros.bandaGlobal,
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Notificaciones de regeneración fallaron (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 21) Auditoría (tolerante a fallos)
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.PLAN_REGENERADO,
        entidad: 'PlanAlimentacionVersion',
        entidadId: versionNueva.idPlanAlimentacionVersion,
        usuarioId: solicitud.nutricionistaUserId,
        gimnasioId: solicitud.gimnasioId,
        metadata: {
          planId: plan.idPlanAlimentacion,
          versionAnteriorId: versionActual.idPlanAlimentacionVersion,
          versionNuevaId: versionNueva.idPlanAlimentacionVersion,
          numeroVersion: numeroVersionNuevo,
          scope: solicitud.scope,
          motivoCambio,
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
        `Auditoria PLAN_REGENERADO falló (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.logger.log(
      `Plan IA regenerado: planId=${plan.idPlanAlimentacion} scope=${solicitud.scope} v${numeroVersionNuevo} banda=${validacionMacros.bandaGlobal} duracionMs=${Date.now() - inicioMs}`,
    );

    return {
      planAlimentacionId: plan.idPlanAlimentacion,
      versionAnteriorId: versionActual.idPlanAlimentacionVersion,
      versionNuevaId: versionNueva.idPlanAlimentacionVersion,
      numeroVersionNuevo,
      plan: planMerged,
      motivoCambio,
      validacion: validacionRestricciones,
      macros: validacionMacros,
    };
  }

  // ========================================================================
  // HELPERS PRIVADOS
  // ========================================================================

  private validarParametros(solicitud: SolicitudRegenerarPlan): void {
    if (!['PLAN', 'DIA', 'ALTERNATIVA'].includes(solicitud.scope)) {
      throw new BadRequestError(
        `scope inválido: ${solicitud.scope}. Debe ser PLAN, DIA o ALTERNATIVA.`,
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

  private aplicarMerge(
    planActual: PlanAlimentacionDatosJson,
    planGenerado: PlanAlimentacionDatosJson,
    solicitud: SolicitudRegenerarPlan,
  ): PlanAlimentacionDatosJson {
    if (solicitud.scope === 'PLAN') {
      // Reemplazar estructura completa, pero preservar el resto del JSON si lo hay
      return {
        ...planActual,
        estructura: planGenerado.estructura,
        macrosPorDia: planGenerado.macrosPorDia,
        razonamientoCumplimiento: planGenerado.razonamientoCumplimiento,
      };
    }

    if (solicitud.scope === 'DIA' && solicitud.dia) {
      const nuevaEstructura = planActual.estructura.map((dia) => {
        if (dia.dia !== solicitud.dia) return dia;
        // Encontrar la estructura regenerada que corresponde al día solicitado
        const diaRegenerado = planGenerado.estructura[0];
        if (!diaRegenerado) return dia;
        return {
          ...dia,
          comidas: diaRegenerado.comidas,
        };
      });
      return {
        ...planActual,
        estructura: nuevaEstructura,
        macrosPorDia: {
          ...planActual.macrosPorDia,
          ...(planGenerado.macrosPorDia ?? {}),
        },
        razonamientoCumplimiento:
          planGenerado.razonamientoCumplimiento ??
          planActual.razonamientoCumplimiento,
      };
    }

    if (
      solicitud.scope === 'ALTERNATIVA' &&
      solicitud.dia &&
      solicitud.comidaSlot &&
      solicitud.alternativaIndex !== undefined
    ) {
      const altIdx = solicitud.alternativaIndex;
      const nuevaEstructura = planActual.estructura.map((dia) => {
        if (dia.dia !== solicitud.dia) return dia;
        return {
          ...dia,
          comidas: dia.comidas.map((comida) => {
            if (comida.tipo !== solicitud.comidaSlot) return comida;
            const nuevasAlternativas = [...comida.alternativas];
            if (altIdx >= nuevasAlternativas.length) {
              throw new BadRequestError(
                `alternativaIndex ${altIdx} fuera de rango (max ${nuevasAlternativas.length - 1})`,
              );
            }
            const alternativaGenerada = planGenerado.estructura[0]?.comidas[0]
              ?.alternativas[0];
            if (alternativaGenerada) {
              nuevasAlternativas[altIdx] = alternativaGenerada;
            }
            return { ...comida, alternativas: nuevasAlternativas };
          }),
        };
      });
      return {
        ...planActual,
        estructura: nuevaEstructura,
        razonamientoCumplimiento:
          planGenerado.razonamientoCumplimiento ??
          planActual.razonamientoCumplimiento,
      };
    }

    return planActual;
  }

  private mapearMotivoCambio(scope: ScopeRegeneracion): MotivoCambio {
    switch (scope) {
      case 'PLAN':
        return 'regeneracion_completa';
      case 'DIA':
        return 'regeneracion_dia';
      case 'ALTERNATIVA':
        return 'regeneracion_alternativa';
    }
  }

  private validarIndiceAlternativa(
    plan: PlanAlimentacionDatosJson,
    dia: DiaSemana,
    comidaSlot: TipoComida,
    alternativaIndex: number,
  ): void {
    const diaEncontrado = plan.estructura.find((d) => d.dia === dia);
    if (!diaEncontrado) {
      throw new BadRequestError(
        `El día ${dia} no existe en la versión actual del plan`,
      );
    }
    const comidaEncontrada = diaEncontrado.comidas.find(
      (c) => c.tipo === comidaSlot,
    );
    if (!comidaEncontrada) {
      throw new BadRequestError(
        `La comida ${comidaSlot} no existe en el día ${dia} del plan actual`,
      );
    }
    if (alternativaIndex >= comidaEncontrada.alternativas.length) {
      throw new BadRequestError(
        `alternativaIndex ${alternativaIndex} fuera de rango (max ${comidaEncontrada.alternativas.length - 1})`,
      );
    }
  }

  private esEstructuraValida(plan: unknown): plan is PlanAlimentacionDatosJson {
    if (!plan || typeof plan !== 'object') return false;
    const p = plan as PlanAlimentacionDatosJson;
    if (!Array.isArray(p.estructura)) return false;
    if (p.estructura.length === 0) return false;
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}