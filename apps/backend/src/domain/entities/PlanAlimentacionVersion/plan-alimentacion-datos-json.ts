import { DiaSemana } from '../DiaPlan/DiaSemana';
import { TipoComida } from '../OpcionComida/TipoComida';

/**
 * Snapshot inmutable de un plan de alimentación generado o editado.
 *
 * Este JSON se persiste en `plan_alimentacion_version.datos_json` y representa
 * el contenido completo del plan en un momento dado. La entidad
 * `PlanAlimentacionVersionEntity` garantiza inmutabilidad: cualquier cambio
 * produce una nueva versión, no se muta la existente.
 */
export interface PlanAlimentacionDatosJson {
  estructura: Array<{
    dia: DiaSemana;
    comidas: Array<{
      tipo: TipoComida;
      alternativas: Array<ItemComidaSnapshot>;
    }>;
  }>;
  macrosPorDia: Record<DiaSemana, ResumenMacrosDia>;
  razonamientoCumplimiento: {
    restriccionesCumplidas: Array<{
      restriccion: string;
      detalle: string;
    }>;
    restriccionesNoCumplidas: Array<{
      restriccion: string;
      detalle: string;
      comida?: string;
      alternativa?: number;
      alimento?: string;
    }>;
  };
}

/**
 * Snapshot de una alternativa individual de comida dentro de un plan.
 * El campo `alimentos` referencia IDs del catálogo, no nombres hardcoded,
 * para mantener trazabilidad nutricional.
 */
export interface ItemComidaSnapshot {
  nombre: string;
  /** Si la alternativa fue armada desde una preparación reutilizable. */
  preparacionId?: number | null;
  alimentos: Array<{
    alimentoId: number;
    nombre?: string;
    cantidad: number;
    unidad: string;
    /** Macros individuales escalados a la cantidad especificada. */
    calorias?: number;
    proteinas?: number;
    carbohidratos?: number;
    grasas?: number;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

/**
 * Resumen nutricional agregado de un día completo.
 * Permite calcular bandas verde/amarillo/rojo comparando contra el objetivo.
 */
export interface ResumenMacrosDia {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

/**
 * Motivo por el cual se creó una versión del plan.
 *
 * - `creacion_inicial`: primera versión al crear el plan (manual o IA).
 * - `regeneracion_completa`: se regeneró el plan entero con IA.
 * - `regeneracion_dia`: se regeneró un único día.
 * - `regeneracion_alternativa`: se regeneró una sola alternativa.
 * - `edicion_manual`: el nutricionista editó a mano.
 *
 * El seed usa adicionalmente `creacion_inicial_backfill` para distinguir
 * versiones creadas por la migración de datos existentes.
 */
export type MotivoCambio =
  | 'creacion_inicial'
  | 'creacion_inicial_backfill'
  | 'regeneracion_completa'
  | 'regeneracion_dia'
  | 'regeneracion_alternativa'
  | 'edicion_manual';
