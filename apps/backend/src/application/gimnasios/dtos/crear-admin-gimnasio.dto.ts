import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CrearAdminGimnasioDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nombre: string;

  @IsEmail()
  email: string;
}
