import {
  PlanAlimentacionDatosJson,
  MotivoCambio,
} from './plan-alimentacion-datos-json';

/**
 * Entidad de dominio inmutable que representa una versión específica de un
 * plan de alimentación.
 *
 * Regla de inmutabilidad: una vez creada, esta entidad NO debe mutarse.
 * Para "modificar" un plan se crea una nueva versión (numeroVersion+1)
 * mediante `PlanAlimentacionVersionRepository.crear(...)`.
 *
 * El repositorio TypeORM NO expone `update` ni `delete`: cualquier intento
 * de modificar datos debe pasar por una nueva versión. Esto garantiza
 * auditoría clínica completa y permite que `plan_alimentacion_version.activa`
 * funcione como puntero inmutable al estado actual del plan.
 */
export class PlanAlimentacionVersionEntity {
  constructor(
    public readonly idPlanAlimentacionVersion: number,
    public readonly idPlanAlimentacion: number,
    public readonly numeroVersion: number,
    public readonly datosJson: PlanAlimentacionDatosJson,
    public readonly motivoCambio: MotivoCambio | null,
    public readonly activa: boolean,
    public readonly createdAt: Date,
    public readonly createdBy: number,
  ) {}
}