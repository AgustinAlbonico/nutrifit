/**
 * SolicitudPlanSemanalHttpDTO
 * ===========================
 *
 * DTO del payload del POST /ia/plan-semanal. Todos los campos son
 * opcionales excepto `socioId`. El use-case aplica defaults sensatos
 * y valida rangos.
 */

import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SolicitudPlanSemanalHttpDTO {
  @IsInt()
  @Min(1)
  socioId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  diasAGenerar?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  comidasPorDia?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  alternativasPorComida?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notasGeneracion?: string;

  @IsOptional()
  @IsDate()
  fechaInicio?: Date;

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(10000)
  caloriasLimite?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(500)
  proteinasEstimadas?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(1000)
  carbohidratosEstimados?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(300)
  grasasEstimados?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alimentosPreferidos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alimentosEvitados?: string[];
}
