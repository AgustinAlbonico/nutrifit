/**
 * ActivarPlanAlimentacionUseCase
 * ==============================
 *
 * Activa una versión específica de un plan de alimentación. Marca la
 * versión como `activa=true` y desactiva todas las demás versiones del
 * mismo plan. Además marca el plan como estado='ACTIVO'.
 *
 * Reglas:
 *  - Plan debe existir (404).
 *  - Versión debe existir (404).
 *  - Versión debe pertenecer al plan (409).
 *  - NUT debe ser dueño del plan (403).
 *  - Plan no debe estar FINALIZADO (409).
 *  - Versión debe tener macros en banda VERDE (re-validar). Si AMARILLO
 *    o ROJO → 422.
 *
 * Flujo (transacción atómica):
 *  1. UPDATE plan_alimentacion_version SET activa=false WHERE id_plan_alimentacion=:planId
 *  2. UPDATE plan_alimentacion_version SET activa=true WHERE id_plan_alimentacion_version=:versionId
 *  3. UPDATE plan_alimentacion SET estado='ACTIVO' WHERE id_plan_alimentacion=:planId
 *
 * Notificaciones:
 *  - PLAN_ACTIVO al socio titular del plan.
 *
 * Auditoría:
 *  - PLAN_ACTIVADO (tolerante a fallos).
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
  PlanAlimentacionOrmEntity,
  PlanAlimentacionVersionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { MacrosValidator } from 'src/domain/validators/macros-validator';
import type { FichaClinicaParaValidacion } from 'src/domain/validators/restricciones-validator-v2';
import { calcularObjetivoMacros } from 'src/domain/services/objetivo-macros.helper';
import { BloqueoGeneracionPlanIaService } from '../services/bloqueo-generacion-plan-ia.service';
import { prepararActivacionExclusivaPlan } from '../services/activacion-exclusiva-plan.service';

export interface SolicitudActivarPlan {
  planAlimentacionId: number;
  versionId: number;
  nutricionistaUserId: number;
  gimnasioId: number;
}

export interface RespuestaActivarPlan {
  planAlimentacionId: number;
  versionActivaId: number;
  estado: 'ACTIVO';
}

/**
 * Margen permitido para activar un plan: SOLO si la banda global es VERDE
 * (desvío ±5%). AMARILLO y ROJO bloquean la activación con 422.
 */
@Injectable()
export class ActivarPlanAlimentacionUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepo: Repository<FichaSaludOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
    private readonly dataSource: DataSource,
    private readonly bloqueoGeneracionPlanIa: BloqueoGeneracionPlanIaService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudActivarPlan,
  ): Promise<RespuestaActivarPlan> {
    // 1) Cargar plan
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: solicitud.planAlimentacionId },
      relations: { socio: true, nutricionista: { usuario: true } },
    });
    if (!plan) {
      throw new NotFoundError(
        'Plan de alimentación',
        String(solicitud.planAlimentacionId),
      );
    }

    // 2) Multi-tenant
    if (
      plan.socio &&
      (plan.socio as unknown as { gimnasioId: number | null }).gimnasioId !==
        this.tenantContext.gimnasioId
    ) {
      throw new ForbiddenError('El plan pertenece a otro gimnasio');
    }

    // 3) Plan FINALIZADO → no se puede activar nada
    if (plan.estado === 'FINALIZADO') {
      throw new ConflictError(
        'PLAN_FINALIZADO: el plan está finalizado y no admite activación de versiones',
      );
    }
    if (plan.eliminadoEn) {
      throw new ConflictError(
        'PLAN_ELIMINADO: el plan fue eliminado y no puede volver a activarse',
      );
    }

    // 4) NUT dueño
    const ownerId =
      plan.nutricionista.usuario?.idUsuario ?? plan.nutricionista.idPersona;
    if (ownerId !== solicitud.nutricionistaUserId) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño del plan puede activarlo',
      );
    }

    const socioId = (plan.socio as unknown as { idPersona: number | null })
      .idPersona;
    if (socioId == null) {
      throw new NotFoundError('Socio', String(solicitud.planAlimentacionId));
    }

    await this.bloqueoGeneracionPlanIa.verificarSinGeneracionActiva({
      socioId,
      gimnasioId: solicitud.gimnasioId,
      planAlimentacionId: solicitud.planAlimentacionId,
    });

    // 5) Preparar validación clínica. La versión se recarga bajo lock.
    const fichaClinica = await this.cargarFichaClinica(socioId);
    const objetivoMacros = calcularObjetivoMacros(fichaClinica);

    // 6) Transacción: bloquear, validar y activar de forma atómica.
    const fechaActivacion = new Date();
    const version = await this.dataSource.transaction(async (manager) => {
      const versionRepo = manager.getRepository(
        PlanAlimentacionVersionOrmEntity,
      );
      const planRepoTx = manager.getRepository(PlanAlimentacionOrmEntity);

      await prepararActivacionExclusivaPlan(
        manager,
        socioId,
        plan.idPlanAlimentacion,
        fechaActivacion,
      );

      const versionBloqueada = await versionRepo.findOne({
        where: { idPlanAlimentacionVersion: solicitud.versionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!versionBloqueada) {
        throw new NotFoundError('Versión de plan', String(solicitud.versionId));
      }
      if (versionBloqueada.idPlanAlimentacion !== plan.idPlanAlimentacion) {
        throw new ConflictError(
          'La versión indicada no pertenece al plan solicitado',
        );
      }
      if (versionBloqueada.numeroVersion === 0) {
        throw new ConflictError(
          'VERSION_BORRADOR: guardá una versión definitiva antes de activar el plan',
        );
      }

      const validacionMacros = MacrosValidator.validar(
        versionBloqueada.datosJson,
        objetivoMacros,
        versionBloqueada.datosJson.estructura.length,
        versionBloqueada.datosJson.estructura[0]?.comidas.length ?? 4,
        fechaActivacion,
      );
      if (
        !validacionMacros.cumpleEstructura ||
        versionBloqueada.datosJson.estructura.length === 0
      ) {
        throw new BadRequestError(
          'PLAN_ESTRUCTURA_INVALIDA: la versión no contiene un plan completo para activar',
          { codigo: 'PLAN_ESTRUCTURA_INVALIDA' },
        );
      }
      if (validacionMacros.bandaGlobal !== 'VERDE') {
        throw new BadRequestError(
          `MACROS_NO_VERDES: la versión tiene banda global ${validacionMacros.bandaGlobal}. Solo se pueden activar versiones con banda VERDE (desvío ±5%).`,
          {
            codigo: 'MACROS_NO_VERDES',
            bandaGlobal: validacionMacros.bandaGlobal,
          },
        );
      }

      // 7a) Desactivar todas las versiones del plan
      await versionRepo
        .createQueryBuilder()
        .update()
        .set({ activa: false })
        .where('id_plan_alimentacion = :planId', {
          planId: plan.idPlanAlimentacion,
        })
        .execute();

      // 7b) Activar la versión indicada
      await versionRepo
        .createQueryBuilder()
        .update()
        .set({ activa: true })
        .where('id_plan_alimentacion_version = :versionId', {
          versionId: versionBloqueada.idPlanAlimentacionVersion,
        })
        .execute();

      // 7c) Marcar plan como ACTIVO
      await planRepoTx
        .createQueryBuilder()
        .update()
        .set({
          estado: 'ACTIVO',
          activo: true,
          ultimaEdicion: fechaActivacion,
        })
        .where('id_plan_alimentacion = :planId', {
          planId: plan.idPlanAlimentacion,
        })
        .execute();

      return versionBloqueada;
    });

    // 8) Notificación al socio titular
    try {
      const socioPersonaId = (
        plan.socio as unknown as { idPersona: number | null }
      ).idPersona;
      if (socioPersonaId) {
        const socio = await this.socioRepo.findOne({
          where: { idPersona: socioPersonaId },
          relations: { usuario: true },
        });
        if (socio?.usuario?.idUsuario) {
          await this.notificacionesService.crear({
            destinatarioId: socio.usuario.idUsuario,
            tipo: TipoNotificacion.PLAN_ACTIVO,
            titulo: 'Tu plan de alimentación está activo',
            mensaje: `Tu nutricionista activó una nueva versión del plan. Revisala en la app.`,
            metadata: {
              planId: plan.idPlanAlimentacion,
              versionId: version.idPlanAlimentacionVersion,
              numeroVersion: version.numeroVersion,
            },
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        `Notificación PLAN_ACTIVO falló (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 9) Auditoría (tolerante a fallos)
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.PLAN_ACTIVADO,
        entidad: 'PlanAlimentacion',
        entidadId: plan.idPlanAlimentacion,
        usuarioId: solicitud.nutricionistaUserId,
        gimnasioId: solicitud.gimnasioId,
        metadata: {
          versionId: version.idPlanAlimentacionVersion,
          numeroVersion: version.numeroVersion,
          motivoCambio: version.motivoCambio,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Auditoria PLAN_ACTIVADO falló (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.logger.log(
      `Plan activado: planId=${plan.idPlanAlimentacion} versionId=${version.idPlanAlimentacionVersion} v${version.numeroVersion}`,
    );

    return {
      planAlimentacionId: plan.idPlanAlimentacion,
      versionActivaId: version.idPlanAlimentacionVersion,
      estado: 'ACTIVO',
    };
  }

  // ========================================================================
  // HELPERS PRIVADOS
  // ========================================================================

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
}
