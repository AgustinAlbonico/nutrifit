import { IsOptional, IsString, Matches } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class GetTurnosDelDiaQueryDto {
  @IsOptional()
  @IsString()
  socio?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'horaDesde debe estar en formato HH:mm',
  })
  horaDesde?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'horaHasta debe estar en formato HH:mm',
  })
  horaHasta?: string;

  @IsOptional()
  @IsString()
  objetivo?: string;
}
