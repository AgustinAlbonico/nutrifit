import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ConfirmarRecuperacionDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  nuevaContrasena: string;
}
