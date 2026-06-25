/**
 * PlanFeedbackRepository (puerto abstracto)
 * ==========================================
 *
 * Wrapper de dominio sobre `plan_feedback`. Cada fila es el voto (POSITIVO
 * o NEGATIVO) + comentario opcional que un nutricionista emite sobre una
 * versión específica de un plan IA.
 *
 * Regla: 1 feedback por versión. La constraint UNIQUE en BD
 * (`uk_feedback_version`) lo garantiza y esta capa lo expone vía
 * `obtenerPorVersion`.
 */

import type {
  PlanFeedbackEntity,
  VotoPlan,
} from '../entities/PlanFeedback/plan-feedback.entity';

/**
 * Token de inyección. Sigue la convención del proyecto.
 */
export const PLAN_FEEDBACK_REPOSITORY = Symbol('PlanFeedbackRepository');

export interface CrearPlanFeedbackInput {
  idPlanAlimentacionVersion: number;
  idNutricionista: number;
  voto: VotoPlan;
  comentario: string | null;
}

export interface ActualizarPlanFeedbackInput {
  voto: VotoPlan;
  comentario: string | null;
}

export abstract class PlanFeedbackRepository {
  abstract crear(input: CrearPlanFeedbackInput): Promise<PlanFeedbackEntity>;

  abstract actualizar(
    id: number,
    cambios: ActualizarPlanFeedbackInput,
  ): Promise<PlanFeedbackEntity>;

  abstract obtenerPorVersion(
    versionId: number,
  ): Promise<PlanFeedbackEntity | null>;

  /**
   * Busca un feedback por su ID. Usado por `EditarFeedbackPlanUseCase`
   * donde el controller ya validó el versionId.
   */
  abstract obtenerPorId(id: number): Promise<PlanFeedbackEntity | null>;
}
