import { IsString, MaxLength, MinLength } from 'class-validator';

export class MarcarAusenteManualDto {
  @IsString()
  @MinLength(3, { message: 'El motivo debe tener al menos 3 caracteres.' })
  @MaxLength(500, { message: 'El motivo no puede superar los 500 caracteres.' })
  motivo: string;
}
