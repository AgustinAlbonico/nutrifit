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
}
