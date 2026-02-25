import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

export class ActualizarAlimentoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @IsOptional()
  @IsEnum(UnidadMedida)
  unidadMedida?: UnidadMedida;

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
