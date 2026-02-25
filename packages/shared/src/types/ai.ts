/**
 * Tipos para la integración de IA en recomendaciones nutricionales.
 * Proveedor-agnóstico - no depende de Groq u otro proveedor específico.
 */

// Tipo de comida del día
export type TipoComida = 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION';

export interface ContextoPaciente {
  socioId: number;
  peso: number | null;
  altura: number | null;
  alergias: string[];
  patologias: string[];
  restriccionesAlimentarias: string | null;
  objetivoPersonal: string;
  nivelActividadFisica: string;
  frecuenciaComidas: string | null;
  consumoAguaDiario: number | null;
  medicamentosActuales: string | null;
  suplementosActuales: string | null;
  consumoAlcohol: string | null;
  fumaTabaco: boolean;
  horasSueno: number | null;
  cirugiasPrevias: string | null;
  antecedentesFamiliares: string | null;
}

// Recomendación de una comida individual
export interface RecomendacionComida {
  nombre: string;
  descripcion: string;
  ingredientes: string[];
  caloriasEstimadas: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  tipoComida: TipoComida;
}

// Plan de un día
export interface DiaPlanSemanal {
  dia: number; // 1-7 (Lunes a Domingo)
  comidas: RecomendacionComida[];
}

// Plan semanal completo generado por IA
export interface PlanSemanalIA {
  dias: DiaPlanSemanal[];
  caloriasTotalesDiarias: number;
  disclaimer: string;
}

// Sustitución de alimento sugerida
export interface SustitucionAlimento {
  alimentoOriginal: string;
  alimentoSugerido: string;
  razon: string;
  caloriasEquivalentes: boolean;
}

// Análisis nutricional de un plan
export interface AnalisisNutricional {
  caloriasDiarias: number;
  proteinasGramos: number;
  carbohidratosGramos: number;
  grasasGramos: number;
  fibraGramos: number | null;
  sodioMg: number | null;
  azucaresGramos: number | null;
  distribucionMacros: {
    proteinas: number; // porcentaje
    carbohidratos: number; // porcentaje
    grasas: number; // porcentaje
  };
  advertencias: string[];
}

// Wrapper de respuesta de IA genérico
export interface RespuestaIA<T> {
  exito: boolean;
  datos: T | null;
  error: string | null;
  disclaimer: string;
}

// Request para generar recomendaciones
export interface SolicitudRecomendacion {
  socioId: number;
  tipoComida?: TipoComida;
  preferenciasAdicionales?: string;
}

// Request para generar plan semanal
export interface SolicitudPlanSemanal {
  socioId: number;
  caloriasObjetivo?: number;
  diasAGenerar?: number; // Default 7
}

// Request para sustitución
export interface SolicitudSustitucion {
  alimento: string;
  razon?: string; // ej: "no me gusta", "alergia"
}

// Request para análisis nutricional
export interface SolicitudAnalisis {
  planId: number;
}
