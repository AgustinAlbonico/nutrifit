import { IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
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
