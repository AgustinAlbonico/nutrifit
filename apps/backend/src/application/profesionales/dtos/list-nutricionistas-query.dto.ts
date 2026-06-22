import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export type OrdenCampoNutricionista = 'NOMBRE' | 'ESTADO' | 'EXPERIENCIA';
export type OrdenDireccion = 'ASC' | 'DESC';
export type FiltroAntiguedad = 'TODAS' | '0-2' | '3-5' | '6-10' | '11+';

export class ListNutricionistasQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 9;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['TODOS', 'ACTIVO', 'INACTIVO'])
  estado?: 'TODOS' | 'ACTIVO' | 'INACTIVO' = 'TODOS';

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsIn(['TODAS', '0-2', '3-5', '6-10', '11+'])
  antiguedad?: FiltroAntiguedad = 'TODAS';

  @IsOptional()
  @IsIn(['NOMBRE', 'ESTADO', 'EXPERIENCIA'])
  ordenCampo?: OrdenCampoNutricionista = 'NOMBRE';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  ordenDireccion?: OrdenDireccion = 'ASC';
}
