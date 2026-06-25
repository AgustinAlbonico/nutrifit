/**
 * PlanAlimentacionVersionRepository (puerto abstracto)
 * ====================================================
 *
 * Reglas:
 * - NO expone `update` ni `delete`. Cada cambio produce una nueva versión
 *   inmutable. El único método "transaccional" es `marcarActiva` que
 *   cambia el flag activa en la fila correspondiente.
 * - `crear` SIEMPRE crea nueva fila, incluso si ya existe v1 (UNIQUE
 *   constraint `(id_plan_alimentacion, numero_version)` lo garantiza).
 */

import type { PlanAlimentacionVersionEntity } from '../entities/PlanAlimentacionVersion/plan-alimentacion-version.entity';
import type { MotivoCambio } from '../entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';
import type { PlanAlimentacionDatosJson } from '../entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

/**
 * Token de inyección para el repositorio. Sigue la convención del proyecto
 * (ver `NUTRICIONISTA_REPOSITORY`, `SOCIO_REPOSITORY`, etc.).
 */
export const PLAN_ALIMENTACION_VERSION_REPOSITORY = Symbol(
  'PlanAlimentacionVersionRepository',
);

export interface CrearPlanAlimentacionVersionInput {
  idPlanAlimentacion: number;
  numeroVersion: number;
  datosJson: PlanAlimentacionDatosJson;
  motivoCambio: MotivoCambio | null;
  activa: boolean;
  createdBy: number;
}

export abstract class PlanAlimentacionVersionRepository {
  abstract crear(
    input: CrearPlanAlimentacionVersionInput,
  ): Promise<PlanAlimentacionVersionEntity>;

  abstract obtenerPorId(
    id: number,
  ): Promise<PlanAlimentacionVersionEntity | null>;

  abstract listarPorPlan(
    planAlimentacionId: number,
  ): Promise<PlanAlimentacionVersionEntity[]>;

  abstract obtenerActiva(
    planAlimentacionId: number,
  ): Promise<PlanAlimentacionVersionEntity | null>;

  /**
   * Transaccional: marca todas las versiones del plan como activa=false,
   * luego marca la indicada como activa=true. Retorna la versión activada.
   */
  abstract marcarActiva(
    planAlimentacionId: number,
    versionId: number,
  ): Promise<PlanAlimentacionVersionEntity>;
}
