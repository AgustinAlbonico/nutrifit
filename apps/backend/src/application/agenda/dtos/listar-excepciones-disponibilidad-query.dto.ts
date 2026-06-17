import { IsDateString, IsOptional } from 'class-validator';

export class ListarExcepcionesDisponibilidadQueryDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
