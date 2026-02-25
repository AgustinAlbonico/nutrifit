import { IsDateString, IsString, Matches } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class ReprogramarTurnoSocioDto {
  @IsDateString()
  fechaTurno: string;

  @IsString()
  @Matches(TIME_REGEX, {
    message: 'horaTurno debe estar en formato HH:mm',
  })
  horaTurno: string;
}
