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
