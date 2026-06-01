import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Input DTO para aplicar un borrador IA como plan real.
 *
 * El nutricionista recibe el borrador (PlanSemanalDraft) del paso de generación,
 * confirma que no hay conflictos de mapeo de ingredientes, y decide aplicar.
 *
 * Scope de Task 4: aplicar borrador IA al plan real persistido.
 */
export class AplicarDraftPlanSemanalDto {
  @IsNumber()
  socioId: number;

  @IsString()
  objetivoNutricional: string;

  /** Días del plan semanal generado por IA (ya validado por Task 1) */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiaPlanSemanalInputDto)
  dias: DiaPlanSemanalInputDto[];
}

export class DiaPlanSemanalInputDto {
  @IsNumber()
  dia: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComidaPlanSemanalInputDto)
  comidas: ComidaPlanSemanalInputDto[];
}

export class ComidaPlanSemanalInputDto {
  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsArray()
  @IsString({ each: true })
  ingredientes: string[];

  @IsNumber()
  caloriasEstimadas: number;

  @IsNumber()
  proteinas: number;

  @IsNumber()
  carbohidratos: number;

  @IsNumber()
  grasas: number;

  @IsEnum(['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'])
  tipoComida: 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION';
}

/**
 * Resultado de aplicar un borrador IA.
 */
export class AplicarDraftPlanSemanalResponseDto {
  @IsNumber()
  planId: number;

  @IsNumber()
  socioId: number;

  @IsString()
  objetivoNutricional: string;

  @IsNumber()
  diasCreados: number;

  @IsString()
  disclaimer: string;
}

/**
 * Conflictos de mapeo detectados al intentar aplicar.
 * Si existe хотя бы uno, la aplicación es rechazada.
 */
export class ConflictoMapeoDto {
  @IsString()
  ingredienteOriginal: string;

  @IsString()
  razon: string;

  @IsOptional()
  @IsString()
  mensaje?: string;
}

/**
 * Respuesta cuando la aplicación es rechazada por conflictos de mapeo.
 */
export class AplicarDraftRechazadoDto {
  @IsString()
  mensaje: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConflictoMapeoDto)
  conflictos: ConflictoMapeoDto[];
}
