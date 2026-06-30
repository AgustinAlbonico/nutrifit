import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

export class ActualizarPreparacionItemDto {
  @IsNumber()
  @Min(1)
  alimentoId: number;

  @IsNumber()
  @IsPositive()
  cantidadDefault: number;

  @IsEnum(UnidadMedida)
  unidadDefault: UnidadMedida;
}

export class ActualizarPreparacionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActualizarPreparacionItemDto)
  items?: ActualizarPreparacionItemDto[];
}
