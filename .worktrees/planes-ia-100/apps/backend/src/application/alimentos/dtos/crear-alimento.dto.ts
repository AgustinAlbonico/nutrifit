import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

export class CrearAlimentoDto {
  @IsString()
  nombre: string;

  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsEnum(UnidadMedida)
  unidadMedida: UnidadMedida;

  @IsOptional()
  @IsNumber()
  calorias?: number | null;

  @IsOptional()
  @IsNumber()
  proteinas?: number | null;

  @IsOptional()
  @IsNumber()
  carbohidratos?: number | null;

  @IsOptional()
  @IsNumber()
  grasas?: number | null;

  @IsOptional()
  @IsNumber()
  hidratosDeCarbono?: number | null;

  @IsOptional()
  @IsNumber()
  grupoAlimenticioId?: number | null;
}
