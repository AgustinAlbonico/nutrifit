import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
  PlanAlimentacionVersionRepository,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import {
  PLAN_FEEDBACK_REPOSITORY,
  PlanFeedbackRepository,
} from 'src/domain/repositories/plan-feedback.repository';
import {
  NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
  NutricionistaIAMemoriaRepository,
} from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  PlanFeedbackEntity,
  VotoPlan,
} from 'src/domain/entities/PlanFeedback/plan-feedback.entity';
import { TipoEjemploIA } from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

export interface SolicitudEditarFeedback {
  feedbackId: number;
  voto: VotoPlan;
  comentario: string | null;
  user: {
    id: number;
    rol: Rol;
    personaId: number | null;
    gimnasioId: number | null;
  };
}

/**
 * EditarFeedbackPlanUseCase
 * =========================
 *
 * Actualiza voto y/o comentario de un feedback existente.
 *
 * Reglas:
 *  - 404 si el feedback no existe.
 *  - 403 si el usuario no es el dueño (NUTRICIONISTA).
 *
 * Memoria IA:
 *  - Si el VOTO cambió Y el comentario no está vacío, se crea una nueva
 *    entrada en `nutricionista_ia_memoria` con el nuevo tipoEjemplo.
 *    La entrada vieja permanece como histórica (no se muta).
 *  - Si el voto NO cambió, no se crea nueva entrada de memoria.
 */
@Injectable()
export class EditarFeedbackPlanUseCase implements BaseUseCase {
  constructor(
    @Inject(PLAN_FEEDBACK_REPOSITORY)
    private readonly feedbackRepo: PlanFeedbackRepository,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    @Inject(NUTRICIONISTA_IA_MEMORIA_REPOSITORY)
    private readonly memoriaRepo: NutricionistaIAMemoriaRepository,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    private readonly tenantContext: TenantContextService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(
    solicitud: SolicitudEditarFeedback,
  ): Promise<PlanFeedbackEntity> {
    const { feedbackId, voto, comentario, user } = solicitud;

    // 1) Verificar feedback existente
    const feedbackActual = await this.feedbackRepo.obtenerPorId(feedbackId);
    if (!feedbackActual) {
      throw new NotFoundError('Feedback de plan', String(feedbackId));
    }

    // 2) Cargar versión + plan para validar ownership
    const version = await this.planVersionRepo.obtenerPorId(
      feedbackActual.idPlanAlimentacionVersion,
    );
    if (!version) {
      throw new NotFoundError(
        'Versión de plan',
        String(feedbackActual.idPlanAlimentacionVersion),
      );
    }

    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: version.idPlanAlimentacion },
      relations: { socio: true, nutricionista: true },
    });
    if (!plan) {
      throw new NotFoundError(
        'Plan de alimentación',
        String(version.idPlanAlimentacion),
      );
    }

    if (
      plan.socio &&
      (plan.socio as unknown as { gimnasioId: number | null }).gimnasioId !==
        this.tenantContext.gimnasioId
    ) {
      throw new ForbiddenError('El feedback pertenece a otro gimnasio');
    }

    // 3) Validar nutricionista dueño
    if (user.rol !== Rol.NUTRICIONISTA) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño del plan puede editar feedback',
      );
    }
    if (
      (plan.nutricionista as unknown as { idPersona: number | null })
        .idPersona !== user.personaId
    ) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño del plan puede editar feedback',
      );
    }

    const comentarioNormalizado = comentario?.trim() ? comentario.trim() : null;

    // 4) Actualizar feedback
    const feedbackActualizado = await this.feedbackRepo.actualizar(feedbackId, {
      voto,
      comentario: comentarioNormalizado,
    });

    // 5) Si cambió el voto Y el comentario no está vacío → nueva entrada memoria
    const votoCambio = feedbackActual.voto !== voto;
    if (
      votoCambio &&
      comentarioNormalizado &&
      comentarioNormalizado.length > 0
    ) {
      const tipoEjemplo: TipoEjemploIA =
        voto === 'POSITIVO' ? 'POSITIVO' : 'NEGATIVO';
      await this.memoriaRepo.crear({
        idNutricionista: user.personaId!,
        tipoEjemplo,
        comentario: comentarioNormalizado,
        idPlanAlimentacionVersion: version.idPlanAlimentacionVersion,
      });
      await this.memoriaRepo.rotarSiExcede100(user.personaId!);
    }

    // 6) Auditoría tolerante a fallos
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.FEEDBACK_EDITADO,
        entidad: 'PlanFeedback',
        entidadId: feedbackActualizado.idPlanFeedback,
        usuarioId: user.id,
        gimnasioId: user.gimnasioId,
        metadata: {
          versionId: version.idPlanAlimentacionVersion,
          votoAnterior: feedbackActual.voto,
          votoNuevo: voto,
          votoCambio,
          conComentario: !!comentarioNormalizado,
        },
      });
    } catch {
      // No afecta operación
    }

    return feedbackActualizado;
  }
}
