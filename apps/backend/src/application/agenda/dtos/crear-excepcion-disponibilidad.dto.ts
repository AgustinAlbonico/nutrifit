import {
  IsBoolean,
  IsDateString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CrearExcepcionDisponibilidadDto {
  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsOptional()
  @MaxLength(255)
  motivo?: string | null;

  @IsOptional()
  @IsBoolean()
  confirmarConTurnosOcupados?: boolean;
}
