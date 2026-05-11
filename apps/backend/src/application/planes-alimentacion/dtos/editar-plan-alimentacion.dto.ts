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

export class EditarItemComidaDto {
  @IsInt()
  @Min(1)
  alimentoId: number;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class EditarOpcionComidaDto {
  @IsEnum(TipoComida)
  tipoComida: TipoComida;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comentarios?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditarItemComidaDto)
  items: EditarItemComidaDto[];
}

export class EditarDiaPlanDto {
  @IsEnum(DiaSemana)
  dia: DiaSemana;

  @IsInt()
  @Min(1)
  orden: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditarOpcionComidaDto)
  opcionesComida: EditarOpcionComidaDto[];
}

export class EditarPlanAlimentacionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  planId: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  objetivoNutricional?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivoEdicion: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditarDiaPlanDto)
  dias?: EditarDiaPlanDto[];
}
