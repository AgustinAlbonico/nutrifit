import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class GuardarMedicionesDto {
  // Obligatorios — rangos biológicos
  @IsNotEmpty()
  @IsNumber()
  @Min(20, { message: 'El peso debe ser al menos 20 kg' })
  @Max(500, { message: 'El peso debe ser como máximo 500 kg' })
  peso: number;

  @IsOptional()
  @IsNumber()
  @Min(100, { message: 'La altura debe ser al menos 100 cm' })
  @Max(250, { message: 'La altura debe ser como máximo 250 cm' })
  altura?: number;

  // Perímetros (opcionales)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  perimetroCintura?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  perimetroCadera?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  perimetroBrazo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
  perimetroMuslo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  perimetroPecho?: number;

  // Pliegues cutáneos (opcionales)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pliegueTriceps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pliegueAbdominal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
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
  @Min(30)
  @Max(220)
  frecuenciaCardiaca?: number;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(250)
  tensionSistolica?: number;

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(150)
  tensionDiastolica?: number;

  // Notas
  @IsOptional()
  @IsString()
  notasMedicion?: string;
}
