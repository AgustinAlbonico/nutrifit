import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EstablecerContrasenaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  nuevaContrasena: string;
}
