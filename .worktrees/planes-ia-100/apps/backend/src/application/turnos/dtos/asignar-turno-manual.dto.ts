import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, Matches, Min } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class AsignarTurnoManualDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  socioId: number;

  @IsDateString()
  fechaTurno: string;

  @IsString()
  @Matches(TIME_REGEX, {
    message: 'horaTurno debe estar en formato HH:mm',
  })
  horaTurno: string;
}
