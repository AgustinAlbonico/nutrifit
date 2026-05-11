import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  MaxLength,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerarIdeasComidaInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  objetivo: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restricciones?: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  infoExtra: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  socioId?: number;
}

export class IngredienteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  cantidad: string;

  @IsString()
  @IsNotEmpty()
  unidad: string;
}

export class PropuestaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IngredienteDto)
  ingredientes: IngredienteDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  pasos: string[];
}

export class GenerarIdeasComidaOutputDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => PropuestaDto)
  propuestas: PropuestaDto[];
}
