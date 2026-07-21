/**
 * Voto que un nutricionista emite sobre una versión específica de un plan IA.
 *
 * - POSITIVO: el plan es aceptable / se ajusta a lo esperado.
 * - NEGATIVO: el plan tiene problemas / debe regenerarse.
 *
 * Cada versión admite UN único voto (constraint UNIQUE en BD).
 */
export type VotoPlan = 'POSITIVO' | 'NEGATIVO';

/**
 * Feedback (voto + comentario opcional) de un nutricionista sobre una
 * versión específica de un plan de alimentación IA.
 *
 * Entidad inmutable en su identidad (idPlanFeedback no cambia) pero los
 * campos voto y comentario pueden actualizarse vía `PlanFeedbackRepository.actualizar(...)`.
 */
export class PlanFeedbackEntity {
  constructor(
    public readonly idPlanFeedback: number,
    public readonly idPlanAlimentacionVersion: number,
    public readonly idNutricionista: number,
    public readonly voto: VotoPlan,
    public readonly comentario: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
