import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarContrasenaDto {
  @IsString()
  @IsNotEmpty()
  contrasenaActual: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  nuevaContrasena: string;
}
