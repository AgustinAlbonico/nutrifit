import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

export class PersistirItemComidaManualDto {
  @IsInt()
  @Min(1)
  alimentoId: number;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsOptional()
  @IsString()
  unidad?: string;
}

export class PersistirAlternativaComidaManualDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersistirItemComidaManualDto)
  alimentos: PersistirItemComidaManualDto[];
}

export class PersistirComidaSlotManualDto {
  @IsEnum(TipoComida)
  tipoComida: TipoComida;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersistirAlternativaComidaManualDto)
  alternativas: PersistirAlternativaComidaManualDto[];
}

export class PersistirDiaPlanManualDto {
  @IsEnum(DiaSemana)
  dia: DiaSemana;

  @IsInt()
  @Min(1)
  orden: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersistirComidaSlotManualDto)
  comidas: PersistirComidaSlotManualDto[];
}

export class PersistirPlanManualDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersistirDiaPlanManualDto)
  dias: PersistirDiaPlanManualDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}
