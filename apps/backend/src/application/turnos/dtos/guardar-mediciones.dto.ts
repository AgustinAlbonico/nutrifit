import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class GuardarMedicionesDto {
  // Obligatorios
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  peso: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altura?: number;

  // Perímetros (opcionales)
  @IsOptional()
  @IsNumber()
  @Min(0)
  perimetroCintura?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  perimetroCadera?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  perimetroBrazo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  perimetroMuslo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  perimetroPecho?: number;

  // Pliegues cutáneos (opcionales)
  @IsOptional()
  @IsNumber()
  @Min(0)
  pliegueTriceps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pliegueAbdominal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pliegueMuslo?: number;

  // Composición corporal (opcionales)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeGrasa?: number;

  // Signos vitales (opcionales)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  frecuenciaCardiaca?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  tensionSistolica?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  tensionDiastolica?: number;

  // Notas
  @IsOptional()
  @IsString()
  notasMedicion?: string;
}
