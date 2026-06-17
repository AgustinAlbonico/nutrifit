import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class DesactivarNutricionistaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  motivo: string;
}

export class DesactivarNutricionistaResultDto {
  message: string;
  turnosCancelados: number;
  sociosAfectados: number;
}
