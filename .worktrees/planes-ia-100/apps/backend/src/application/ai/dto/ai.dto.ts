import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoComida } from '@nutrifit/shared';

export class GenerarRecomendacionDto {
  @IsNumber()
  @Min(1)
  socioId: number;

  @IsOptional()
  @IsEnum(['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'])
  tipoComida?: TipoComida;

  @IsOptional()
  @IsString()
  preferenciasAdicionales?: string;
}

export class GenerarPlanSemanalDto {
  @IsNumber()
  @Min(1)
  socioId: number;

  @IsOptional()
  @IsNumber()
  @Min(1200)
  caloriasObjetivo?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  diasAGenerar?: number;
}

export class SugerirSustitucionDto {
  @IsString()
  alimento: string;

  @IsOptional()
  @IsString()
  razon?: string;
}

export class AnalizarPlanDto {
  @IsNumber()
  @Min(1)
  planId: number;
}

/**
 * DTO de respuesta para el endpoint /ia/plan-semanal.
 * Refleja el contrato RespuestaPlanSemanalDraft definido en @nutrifit/shared.
 */
export class RespuestaPlanSemanalDraftDto {
  @IsBoolean()
  exito: boolean;

  @IsOptional()
  datos: PlanSemanalDraftDto | null;

  @IsOptional()
  @IsString()
  error: string | null;

  @IsString()
  disclaimer: string;
}

export class IngredienteDto {
  @IsString()
  nombre: string;

  @IsString()
  cantidad: string;

  @IsString()
  unidad: string;
}

export class RecomendacionComidaDto {
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
  tipoComida: TipoComida;
}

export class DiaPlanSemanalDto {
  @IsNumber()
  dia: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecomendacionComidaDto)
  comidas: RecomendacionComidaDto[];
}

export class PlanSemanalIADto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiaPlanSemanalDto)
  dias: DiaPlanSemanalDto[];

  @IsNumber()
  caloriasTotalesDiarias: number;

  @IsString()
  disclaimer: string;
}

/**
 * Borrador estable de plan semanal.
 * Contiene metadatos del borrador más el plan validado.
 */
export class PlanSemanalDraftDto {
  /** Estado del borrador: 'borrador' = generado, 'error' = fallido */
  @IsEnum(['borrador', 'error'])
  estado: 'borrador' | 'error';

  /** ID del socio para el cual se generó el plan */
  @IsNumber()
  socioId: number;

  /** Fecha de creación del borrador en formato ISO */
  @IsString()
  fechaCreacion: string;

  /** Plan semanal validado (solo presente si estado='borrador') */
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanSemanalIADto)
  plan: PlanSemanalIADto | null;

  /** Mensaje de error detallado (solo presente si estado='error') */
  @IsOptional()
  @IsString()
  error: string | null;

  /** Disclaimer médico obligatorio */
  @IsString()
  disclaimer: string;
}
