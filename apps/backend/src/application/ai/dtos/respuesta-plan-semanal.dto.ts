/**
 * RespuestaPlanSemanalHttpDTO
 * ===========================
 *
 * Shape de la respuesta del POST /ia/plan-semanal. Incluye plan
 * generado + validación de restricciones + validación de macros.
 */

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

export class RestriccionCumplidaDto {
  @IsString()
  restriccion: string;

  @IsString()
  detalle: string;
}

export class RestriccionNoCumplidaDto {
  @IsString()
  restriccion: string;

  @IsString()
  detalle: string;

  @IsOptional()
  @IsString()
  comida?: string;

  @IsOptional()
  @IsInt()
  alternativa?: number;

  @IsOptional()
  @IsString()
  alimento?: string;
}

export class ResultadoValidacionRestriccionesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestriccionCumplidaDto)
  restriccionesCumplidas: RestriccionCumplidaDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestriccionNoCumplidaDto)
  restriccionesNoCumplidas: RestriccionNoCumplidaDto[];

  @IsArray()
  @IsString({ each: true })
  advertencias: string[];
}

export enum BandaMacroDto {
  VERDE = 'VERDE',
  AMARILLO = 'AMARILLO',
  ROJO = 'ROJO',
}

export class DetalleMacroDto {
  @IsNumber()
  real: number;

  @IsNumber()
  objetivo: number;

  @IsNumber()
  desvio: number;

  @IsEnum(BandaMacroDto)
  banda: BandaMacroDto;
}

export class ResumenMacrosDiaDto {
  @IsNumber()
  calorias: number;

  @IsNumber()
  proteinas: number;

  @IsNumber()
  carbohidratos: number;

  @IsNumber()
  grasas: number;

  @IsNumber()
  desvioPorcentaje: number;

  @IsEnum(BandaMacroDto)
  banda: BandaMacroDto;

  @IsObject()
  detallePorMacro: {
    calorias: DetalleMacroDto;
    proteinas: DetalleMacroDto;
    carbohidratos: DetalleMacroDto;
    grasas: DetalleMacroDto;
  };
}

export class ResultadoValidacionMacrosDto {
  @IsBoolean()
  cumpleEstructura: boolean;

  @IsArray()
  @IsString({ each: true })
  diasFaltantes: string[];

  @IsArray()
  comidasFaltantes: Array<{ dia: string; faltantes: string[] }>;

  @IsArray()
  @IsString({ each: true })
  advertencias: string[];

  @IsObject()
  macrosPorDia: Record<string, ResumenMacrosDiaDto>;

  @IsEnum(BandaMacroDto)
  bandaGlobal: BandaMacroDto;

  @IsBoolean()
  puedeAceptar: boolean;
}

export class RespuestaPlanSemanalHttpDTO {
  @IsInt()
  planAlimentacionId: number;

  @IsInt()
  versionId: number;

  @IsInt()
  numeroVersion: number;

  @IsObject()
  plan: PlanAlimentacionDatosJson;

  @ValidateNested()
  @Type(() => ResultadoValidacionRestriccionesDto)
  validacion: ResultadoValidacionRestriccionesDto;

  @ValidateNested()
  @Type(() => ResultadoValidacionMacrosDto)
  macros: ResultadoValidacionMacrosDto;

  @IsArray()
  @IsString({ each: true })
  advertencias: string[];
}
