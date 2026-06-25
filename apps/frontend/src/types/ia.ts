import type {
  TipoComida,
  RecomendacionComida,
  PlanSemanalIA,
  SustitucionAlimento,
  AnalisisNutricional,
  RespuestaIA,
  SolicitudRecomendacion,
  SolicitudPlanSemanal as SolicitudPlanSemanalLegacy,
  SolicitudSustitucion,
  SolicitudAnalisis,
} from '@nutrifit/shared';

export type {
  TipoComida,
  RecomendacionComida,
  PlanSemanalIA,
  SustitucionAlimento,
  AnalisisNutricional,
  RespuestaIA,
  SolicitudRecomendacion,
  SolicitudSustitucion,
  SolicitudAnalisis,
};

// Mantener compatibilidad con el nombre legacy exportado desde shared
export type SolicitudPlanSemanal = SolicitudPlanSemanalLegacy;

export interface ParametrosRecomendacion {
  socioId: number;
  tipoComida?: TipoComida;
  preferenciasAdicionales?: string;
}

export interface ParametrosPlanSemanal {
  socioId: number;
  caloriasObjetivo?: number;
  diasAGenerar?: number;
}

export interface ParametrosSustitucion {
  alimento: string;
  razon?: string;
}

export interface ParametrosAnalisis {
  planId: number;
}

// --- IdeasComida (RF36-RF38) ---
export interface IngredienteIA {
  nombre: string;
  cantidad: string;
  unidad: string;
}

export interface PropuestaIA {
  nombre: string;
  ingredientes: IngredienteIA[];
  pasos: string[];
}

export interface ParametrosIdeasComida {
  objetivo: string;
  restricciones?: string[];
  infoExtra: string;
  socioId?: number;
}

export interface RespuestaIdeasComida {
  propuestas: [PropuestaIA, PropuestaIA];
}

// ============================================================================
// Plan Alimentacion IA v2 (RF-001..RF-013)
// ============================================================================

/** Días de la semana en español. */
export type DiaSemana =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

/** Tipos de comida alineados con TipoComida del backend. */
export type TipoComidaPlan = TipoComida;

/** Banda de desvío de macros (verde/amarillo/rojo). */
export type BandaMacro = 'VERDE' | 'AMARILLO' | 'ROJO';

/** Motivos de cambio entre versiones de un plan. */
export type MotivoCambio =
  | 'creacion_inicial'
  | 'regeneracion_completa'
  | 'regeneracion_dia'
  | 'regeneracion_alternativa'
  | 'edicion_manual'
  | 'creacion_inicial_backfill';

/** Scope de regeneración del plan. */
export type ScopeRegeneracion = 'PLAN' | 'DIA' | 'ALTERNATIVA';

/** Voto de feedback del nutricionista. */
export type VotoPlan = 'POSITIVO' | 'NEGATIVO';

/** Tipo de ejemplo en la memoria IA. */
export type TipoEjemploIA = 'POSITIVO' | 'NEGATIVO';

/** Item de comida snapshot dentro de una estructura de plan. */
export interface ItemComidaSnapshotFE {
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

/** Estructura de un día en el plan semanal. */
export interface EstructuraDiaFE {
  dia: DiaSemana;
  comidas: Array<{
    tipo: TipoComidaPlan;
    alternativas: ItemComidaSnapshotFE[];
  }>;
}

/** Detalle por macro individual dentro del resumen del día. */
export interface DetalleMacroFE {
  real: number;
  objetivo: number;
  desvio: number;
  banda: BandaMacro;
}

/** Resumen de macros por día (verde/amarillo/rojo). */
export interface ResumenMacrosDiaFE {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  desvioPorcentaje: number;
  banda: BandaMacro;
  detallePorMacro: Record<
    'calorias' | 'proteinas' | 'carbohidratos' | 'grasas',
    DetalleMacroFE
  >;
}

/** Estructura de macros agrupados por día. */
export type MacrosPorDiaFE = Partial<Record<DiaSemana, ResumenMacrosDiaFE>>;

/** Razonamiento de cumplimiento de restricciones. */
export interface RazonamientoCumplimientoFE {
  restriccionesCumplidas: Array<{ restriccion: string; detalle: string }>;
  restriccionesNoCumplidas: Array<{
    restriccion: string;
    detalle: string;
    comida?: string;
    alternativa?: number;
    alimento?: string;
  }>;
}

/** Datos del plan almacenados en una versión inmutable. */
export interface PlanAlimentacionDatosJsonFE {
  estructura: EstructuraDiaFE[];
  macrosPorDia: MacrosPorDiaFE;
  razonamientoCumplimiento: RazonamientoCumplimientoFE;
}

/** Resultado de validación de restricciones. */
export interface ResultadoValidacionRestriccionesFE {
  restriccionesCumplidas: Array<{ restriccion: string; detalle: string }>;
  restriccionesNoCumplidas: Array<{
    restriccion: string;
    detalle: string;
    comida?: string;
  }>;
  advertencias: string[];
}

/** Resultado de validación de macros. */
export interface ResultadoValidacionMacrosFE {
  cumpleEstructura: boolean;
  diasFaltantes: DiaSemana[];
  comidasFaltantes: Array<{ dia: DiaSemana; faltantes: TipoComidaPlan[] }>;
  advertencias: string[];
  macrosPorDia: MacrosPorDiaFE;
  bandaGlobal: BandaMacro;
  puedeAceptar: boolean;
}

/** Solicitud para generar plan semanal (payload FE, espejo del DTO backend). */
export interface SolicitudPlanSemanalV2FE {
  socioId: number;
  diasAGenerar?: number;
  comidasPorDia?: number;
  alternativasPorComida?: number;
  notasGeneracion?: string;
  fechaInicio?: string;
}

/** Respuesta del backend al generar plan semanal. */
export interface RespuestaPlanSemanalV2FE {
  planAlimentacionId: number;
  versionId: number;
  numeroVersion: number;
  plan: PlanAlimentacionDatosJsonFE;
  validacion: ResultadoValidacionRestriccionesFE;
  macros: ResultadoValidacionMacrosFE;
  advertencias: string[];
}

/** Solicitud para regenerar plan (con scope granular). */
export interface SolicitudRegeneracionFE {
  planAlimentacionVersionId: number;
  scope: ScopeRegeneracion;
  dia?: DiaSemana;
  comidaSlot?: TipoComidaPlan;
  alternativaIndex?: number;
  confirmarPerdidaEdicionManual?: boolean;
}

/** Respuesta del backend al regenerar plan. */
export interface RespuestaRegeneracionFE {
  nuevaVersionId: number;
  numeroVersion: number;
  motivoCambio: MotivoCambio;
  cambios: {
    dias_modificados?: DiaSemana[];
    comidas_modificadas?: Array<{
      dia: DiaSemana;
      slot: TipoComidaPlan;
      alternativa: number;
    }>;
  };
  validacion: ResultadoValidacionRestriccionesFE;
  macros: ResultadoValidacionMacrosFE;
  plan: PlanAlimentacionDatosJsonFE;
}

/** Resumen de una versión del plan (sin datosJson pesado). */
export interface VersionPlanFE {
  idPlanAlimentacionVersion: number;
  idPlanAlimentacion: number;
  numeroVersion: number;
  motivoCambio: MotivoCambio | null;
  activa: boolean;
  createdAt: string;
  createdBy: number;
}

/** Respuesta del endpoint GET /planes-alimentacion/:id/versiones. */
export interface RespuestaVersionesPlanFE {
  versiones: VersionPlanFE[];
}

/** Feedback del nutricionista sobre una versión. */
export interface PlanFeedbackFE {
  id: number;
  planAlimentacionVersionId: number;
  voto: VotoPlan;
  comentario: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Solicitud para POST/PUT feedback. */
export interface SolicitudFeedbackFE {
  voto: VotoPlan;
  comentario?: string;
}

/** Ejemplo de memoria IA del nutricionista. */
export interface EjemploMemoriaFE {
  idNutricionistaIaMemoria: number;
  tipoEjemplo: TipoEjemploIA;
  comentario: string;
  idPlanAlimentacionVersion: number | null;
  archivada: boolean;
  createdAt: string;
}

/** Respuesta del endpoint GET /nutricionistai/memoria. */
export interface RespuestaMemoriaFE {
  positivos: EjemploMemoriaFE[];
  negativos: EjemploMemoriaFE[];
  totalActivas: number;
  archivadas: number;
}