import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

export class CrearOpcionComidaDto {
  @IsEnum(TipoComida)
  tipoComida: TipoComida;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comentarios?: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  alimentosIds: number[];
}

export class CrearDiaPlanDto {
  @IsEnum(DiaSemana)
  dia: DiaSemana;

  @IsInt()
  @Min(1)
  orden: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearOpcionComidaDto)
  opcionesComida: CrearOpcionComidaDto[];
}

export class CrearPlanAlimentacionDto {
  @IsInt()
  @Min(1)
  socioId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  objetivoNutricional: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearDiaPlanDto)
  dias: CrearDiaPlanDto[];
}
