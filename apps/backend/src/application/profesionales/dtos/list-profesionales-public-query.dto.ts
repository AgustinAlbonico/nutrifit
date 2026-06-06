import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export type SortCatalogo = 'nombre' | 'disponible' | 'recientes';

export class ListProfesionalesPublicQueryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @IsIn(['nombre', 'disponible', 'recientes'])
  sort?: SortCatalogo;

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
  limit?: number = 12;
}
