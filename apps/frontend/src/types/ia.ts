import type {
  TipoComida,
  RecomendacionComida,
  PlanSemanalIA,
  SustitucionAlimento,
  AnalisisNutricional,
  RespuestaIA,
  SolicitudRecomendacion,
  SolicitudPlanSemanal,
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
  SolicitudPlanSemanal,
  SolicitudSustitucion,
  SolicitudAnalisis,
};

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
