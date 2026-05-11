import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmarTurnoTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
