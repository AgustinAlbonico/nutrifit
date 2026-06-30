import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

export class CrearPreparacionItemDto {
  @IsNumber()
  @Min(1)
  alimentoId: number;

  @IsNumber()
  @IsPositive()
  cantidadDefault: number;

  @IsEnum(UnidadMedida)
  unidadDefault: UnidadMedida;
}

export class CrearPreparacionDto {
  @IsString()
  @MaxLength(255)
  nombre: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearPreparacionItemDto)
  items: CrearPreparacionItemDto[];
}
