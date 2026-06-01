import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BloquearTurnoDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener el formato YYYY-MM-DD',
  })
  fecha: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaTurno debe estar en formato HH:mm',
  })
  horaTurno: string;
}
