import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelarTurnoSocioDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
