/**
 * FinalizarPlanAlimentacionUseCase
 * ================================
 *
 * Marca un plan de alimentación como FINALIZADO (estado terminal). El plan
 * deja de ser visible para el socio y no admite más activaciones ni
 * regeneraciones.
 *
 * Reglas:
 *  - Plan debe existir (404).
 *  - NUT debe ser dueño (403).
 *  - Plan debe estar en estado ACTIVO (422 si no — finalizar un BORRADOR
 *    no tiene sentido, se debería eliminar).
 *
 * Efectos:
 *  - UPDATE plan_alimentacion SET estado='FINALIZADO', activo=false, finalizado_at=NOW()
 *  - Notificación PLAN_FINALIZADO al NUT dueño + al socio titular.
 *  - Auditoría PLAN_FINALIZADO_ACCION.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  PlanAlimentacionOrmEntity,
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

export interface SolicitudFinalizarPlan {
  planAlimentacionId: number;
  nutricionistaUserId: number;
  gimnasioId: number;
}

export interface RespuestaFinalizarPlan {
  planAlimentacionId: number;
  estado: 'FINALIZADO';
  finalizadoAt: Date;
}

@Injectable()
export class FinalizarPlanAlimentacionUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudFinalizarPlan,
  ): Promise<RespuestaFinalizarPlan> {
    // 1) Cargar plan
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: solicitud.planAlimentacionId },
      relations: { socio: true, nutricionista: true },
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

    // 3) NUT dueño
    if (
      (plan.nutricionista as unknown as { idPersona: number | null })
        .idPersona !== solicitud.nutricionistaUserId
    ) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño del plan puede finalizarlo',
      );
    }

    // 4) Estado debe ser ACTIVO (422 si no)
    if (plan.estado !== 'ACTIVO') {
      throw new BadRequestError(
        `PLAN_NO_ACTIVO: el plan está en estado ${plan.estado}. Solo se pueden finalizar planes en estado ACTIVO.`,
        {
          codigo: 'PLAN_NO_ACTIVO',
          estadoActual: plan.estado,
        },
      );
    }

    // 5) Update atómico
    const finalizadoAt = new Date();
    await this.planRepo.update(
      { idPlanAlimentacion: plan.idPlanAlimentacion },
      {
        estado: 'FINALIZADO',
        activo: false,
        finalizadoAt,
      },
    );

    // 6) Notificaciones: NUT dueño + socio titular
    try {
      // NUT dueño
      await this.notificacionesService.crear({
        destinatarioId: solicitud.nutricionistaUserId,
        tipo: TipoNotificacion.PLAN_FINALIZADO,
        titulo: 'Plan de alimentación finalizado',
        mensaje: `El plan ${plan.idPlanAlimentacion} fue marcado como FINALIZADO. El socio ya no podrá consultarlo.`,
        metadata: {
          planId: plan.idPlanAlimentacion,
          finalizadoAt: finalizadoAt.toISOString(),
        },
      });

      // Socio titular
      const socioPersonaId = (plan.socio as unknown as {
        idPersona: number | null;
      }).idPersona;
      if (socioPersonaId) {
        const socio = await this.socioRepo.findOne({
          where: { idPersona: socioPersonaId },
          relations: { usuario: true },
        });
        if (socio?.usuario?.idUsuario) {
          await this.notificacionesService.crear({
            destinatarioId: socio.usuario.idUsuario,
            tipo: TipoNotificacion.PLAN_FINALIZADO,
            titulo: 'Tu plan de alimentación fue finalizado',
            mensaje: `Tu nutricionista marcó el plan como finalizado. Si necesitás uno nuevo, reservá un turno.`,
            metadata: {
              planId: plan.idPlanAlimentacion,
              finalizadoAt: finalizadoAt.toISOString(),
            },
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        `Notificaciones PLAN_FINALIZADO fallaron (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 7) Auditoría (tolerante a fallos)
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.PLAN_FINALIZADO_ACCION,
        entidad: 'PlanAlimentacion',
        entidadId: plan.idPlanAlimentacion,
        usuarioId: solicitud.nutricionistaUserId,
        gimnasioId: solicitud.gimnasioId,
        metadata: {
          finalizadoAt: finalizadoAt.toISOString(),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Auditoria PLAN_FINALIZADO falló (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.logger.log(
      `Plan finalizado: planId=${plan.idPlanAlimentacion} finalizadoAt=${finalizadoAt.toISOString()}`,
    );

    return {
      planAlimentacionId: plan.idPlanAlimentacion,
      estado: 'FINALIZADO',
      finalizadoAt,
    };
  }
}