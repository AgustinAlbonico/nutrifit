import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export type OrdenCampoSocio = 'NOMBRE' | 'ESTADO';
export type OrdenDireccion = 'ASC' | 'DESC';

export class ListSociosQueryDto {
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
  @IsIn(['NOMBRE', 'ESTADO'])
  ordenCampo?: OrdenCampoSocio = 'NOMBRE';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  ordenDireccion?: OrdenDireccion = 'ASC';
}
