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

/** Alias para ItemComidaIaFE — nombre usado en el editor de plan manual con IA. */
export type IdeaComidaIa = ItemComidaIaFE;

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
  /** Si fue armada desde una preparación reutilizable. */
  preparacionId?: number | null;
  alimentos: Array<{
    alimentoId: number;
    nombre?: string;
    cantidad: number;
    unidad: string;
    /** Macros individuales escalados (opcionales para compatibilidad). */
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
 * Item sugerido por la IA en el endpoint /ideas-comida.
 * Mismo shape que la alternativa de un plan, más `idTemp` (server-side) y
 * `warnings` (clínica).
 */
export interface ItemComidaIaFE {
  idTemp: string;
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    /** Denormalizado para mostrar en la card sin segundo fetch. */
    nombre: string;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  etiquetas: string[];
  /** No bloquean: solo warning (vegetales altos en Vit-K para anticoagulantes, etc.). */
  warnings: string[];
}

/** Args para POST /planes-alimentacion/:id/ideas-comida. */
export interface GenerarIdeasComidaArgs {
  planAlimentacionId: number;
  dia: DiaSemana;
  tipoComida: TipoComidaPlan;
  cantidadAlternativas?: number;
}

/** Respuesta del endpoint /planes-alimentacion/:id/ideas-comida. */
export interface GenerarIdeasComidaRespuesta {
  /** Texto del prompt enviado (para debug/auditoría). */
  promptUsado: string;
  alternativas: ItemComidaIaFE[];
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

/** Snapshot parcial de una generación IA en curso. */
export interface SnapshotParcialPlanIaFE {
  estructura: EstructuraDiaFE[];
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
  planAlimentacionId?: number;
  diasAGenerar?: number;
  comidasPorDia?: number;
  alternativasPorComida?: number;
  notasGeneracion?: string;
  fechaInicio?: string;
  caloriasLimite?: number;
  proteinasEstimadas?: number;
  carbohidratosEstimados?: number;
  grasasEstimados?: number;
  alimentosPreferidos?: string[];
  alimentosEvitados?: string[];
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

export type EstadoGeneracionPlanIaFE =
  | 'PENDIENTE'
  | 'GENERANDO'
  | 'COMPLETADO'
  | 'ERROR'
  | 'CANCELADO';

export interface GeneracionPlanIaFE {
  id: number;
  socioId: number;
  nutricionistaId: number;
  gimnasioId: number;
  planAlimentacionId: number | null;
  estado: EstadoGeneracionPlanIaFE;
  proveedorActual: string | null;
  mensajeEstado: string | null;
  errorMensaje: string | null;
  respuestaJson: RespuestaPlanSemanalV2FE | null;
  progresoActual: number | null;
  progresoTotal: number | null;
  diaActual: DiaSemana | null;
  comidaActual: TipoComidaPlan | null;
  snapshotParcialJson: SnapshotParcialPlanIaFE | null;
  creadoEn: string;
  actualizadoEn: string;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
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

/**
 * Plan activo de un socio asociado a un nutricionista concreto.
 *
 * Un socio puede tener planes activos de varios nutricionistas (RF-010),
 * por lo que `MiPlanPage` renderiza N cards, una por cada `PlanSocioActivo`.
 *
 * La forma refleja el shape que devolverá el backend cuando el endpoint
 * `GET /planes-alimentacion/socio/:id/activo` evolucione de "1 plan" a "N
 * planes activos (uno por nutricionista)". Mientras tanto, la query del FE
 * normaliza respuestas heterogéneas (`null`, objeto único, array) a array.
 */
export interface PlanSocioActivo {
  /** Identificador del plan (`plan_alimentacion.id_plan_alimentacion`). */
  idPlanAlimentacion: number;
  /** Identificador de la versión activa mostrada al socio. */
  versionId: number;
  /** Nutricionista dueño del plan. */
  nutricionistaId: number;
  /** Nombre legible del nutricionista para mostrar en la card. */
  nutricionistaNombre: string;
  /** Fecha de inicio / activación del plan (ISO 8601). */
  fechaInicio: string;
  /** Snapshot del plan (estructura V2 + macros + razonamiento). */
  plan: PlanAlimentacionDatosJsonFE;
  /** Objetivo nutricional textual (opcional). */
  objetivoNutricional?: string;
}

/**
 * Respuesta cruda que devuelve hoy el endpoint
 * `GET /planes-alimentacion/socio/:id/activo`.
 *
 * El backend aún retorna `null` o un objeto único. Esta unión permite que
 * el frontend sea defensivo: aceptamos cualquiera de las 3 formas y la
 * normalizamos a `PlanSocioActivo[]`.
 */
export type RespuestaPlanesSocioRaw =
  | PlanSocioActivo
  | PlanSocioActivo[]
  | null
  | { data: PlanSocioActivo | PlanSocioActivo[] | null };
