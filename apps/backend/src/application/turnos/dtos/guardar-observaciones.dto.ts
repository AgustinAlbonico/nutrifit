import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GuardarObservacionesDto {
  @IsNotEmpty()
  @IsString()
  comentario: string;

  @IsOptional()
  @IsString()
  sugerencias?: string;

  @IsOptional()
  @IsString()
  habitosSocio?: string;

  @IsOptional()
  @IsString()
  objetivosSocio?: string;
}
