import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ConflictError,
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
import {
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  PlanFeedbackEntity,
  VotoPlan,
} from 'src/domain/entities/PlanFeedback/plan-feedback.entity';
import { TipoEjemploIA } from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

export interface SolicitudCrearFeedback {
  versionId: number;
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
 * CrearFeedbackPlanUseCase
 * ========================
 *
 * Reglas:
 *  - Solo NUTRICIONISTA dueño del plan puede crear feedback.
 *  - Una versión admite un único feedback (UNIQUE constraint). Si ya
 *    existe, throw ConflictError('FEEDBACK_DUPLICADO').
 *  - Si `comentario` no está vacío, se crea una entrada en
 *    `nutricionista_ia_memoria` con tipoEjemplo derivado del voto
 *    (POSITIVO → 'POSITIVO', NEGATIVO → 'NEGATIVO').
 *  - Tras crear la memoria se aplica rotación FIFO (mantener ≤100 activas).
 *
 * Auditoría:
 *  - FEEDBACK_CREADO (tolerante a fallos).
 */
@Injectable()
export class CrearFeedbackPlanUseCase implements BaseUseCase {
  constructor(
    @Inject(PLAN_FEEDBACK_REPOSITORY)
    private readonly feedbackRepo: PlanFeedbackRepository,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    @Inject(NUTRICIONISTA_IA_MEMORIA_REPOSITORY)
    private readonly memoriaRepo: NutricionistaIAMemoriaRepository,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepo: Repository<NutricionistaOrmEntity>,
    private readonly tenantContext: TenantContextService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(
    solicitud: SolicitudCrearFeedback,
  ): Promise<PlanFeedbackEntity> {
    const { versionId, voto, comentario, user } = solicitud;

    // 1) Verificar versión
    const version = await this.planVersionRepo.obtenerPorId(versionId);
    if (!version) {
      throw new NotFoundError('Versión de plan', String(versionId));
    }

    // 2) Cargar plan para validar ownership y gimnasio
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
      throw new ForbiddenError('La versión pertenece a otro gimnasio');
    }

    // 3) Validar nutricionista dueño
    if (user.rol !== Rol.NUTRICIONISTA) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño del plan puede crear feedback',
      );
    }
    if (
      (plan.nutricionista as unknown as { idPersona: number | null })
        .idPersona !== user.personaId
    ) {
      throw new ForbiddenError(
        'Solo el nutricionista dueño del plan puede crear feedback',
      );
    }

    // 4) Validar UNIQUE: 1 feedback por versión
    const existente = await this.feedbackRepo.obtenerPorVersion(versionId);
    if (existente) {
      throw new ConflictError(
        'FEEDBACK_DUPLICADO: ya existe un feedback para esta versión',
      );
    }

    // 5) Crear feedback
    const feedback = await this.feedbackRepo.crear({
      idPlanAlimentacionVersion: versionId,
      idNutricionista: user.personaId!,
      voto,
      comentario: comentario?.trim() ? comentario.trim() : null,
    });

    // 6) Crear memoria IA si comentario no vacío
    const comentarioNormalizado = comentario?.trim() ?? '';
    if (comentarioNormalizado.length > 0) {
      const tipoEjemplo: TipoEjemploIA =
        voto === 'POSITIVO' ? 'POSITIVO' : 'NEGATIVO';
      await this.memoriaRepo.crear({
        idNutricionista: user.personaId!,
        tipoEjemplo,
        comentario: comentarioNormalizado,
        idPlanAlimentacionVersion: versionId,
      });
      await this.memoriaRepo.rotarSiExcede100(user.personaId!);
    }

    // 7) Auditoría (tolerante a fallos)
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.FEEDBACK_CREADO,
        entidad: 'PlanFeedback',
        entidadId: feedback.idPlanFeedback,
        usuarioId: user.id,
        gimnasioId: user.gimnasioId,
        metadata: {
          versionId,
          voto,
          conComentario: comentarioNormalizado.length > 0,
        },
      });
    } catch {
      // No afecta operación
    }

    return feedback;
  }
}
