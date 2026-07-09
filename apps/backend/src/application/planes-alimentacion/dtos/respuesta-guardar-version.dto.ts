import type { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

export interface RestriccionCumplidaDto {
  restriccion: string;
  detalle: string;
}

export interface RestriccionNoCumplidaDto {
  restriccion: string;
  detalle: string;
  comida?: string;
  alternativa?: number;
  alimento?: string;
}

export class ResultadoValidacionRestriccionesDto {
  restriccionesCumplidas: RestriccionCumplidaDto[];
  restriccionesNoCumplidas: RestriccionNoCumplidaDto[];
  advertencias: string[];
}

export interface ResumenMacrosDiaDto {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export type BandaMacroDto = 'VERDE' | 'AMARILLO' | 'ROJO';

export class ResultadoValidacionMacrosDto {
  cumpleEstructura: boolean;
  diasFaltantes: string[];
  comidasFaltantes: string[];
  advertencias: string[];
  macrosPorDia: Record<string, ResumenMacrosDiaDto>;
  bandaGlobal: BandaMacroDto;
  puedeAceptar: boolean;
}

export class RespuestaGuardarVersionDto {
  idPlanAlimentacion: number;
  planAlimentacionId: number;
  versionId: number;
  numeroVersion: number;
  motivoCambio: string;
  plan: PlanAlimentacionDatosJson;
  validacion: ResultadoValidacionRestriccionesDto;
  macros: ResultadoValidacionMacrosDto;
  advertencias: string[];
}