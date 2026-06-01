import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetAgendaDiariaQueryDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener el formato YYYY-MM-DD',
  })
  fecha: string;
}
