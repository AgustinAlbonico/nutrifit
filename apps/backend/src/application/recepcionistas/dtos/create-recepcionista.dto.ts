import {
  IsString,
  IsEmail,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { Genero } from 'src/domain/entities/Persona/Genero';

export class CreateRecepcionistaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  contrasena: string;

  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsEnum(Genero)
  @IsNotEmpty()
  genero: Genero;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  provincia: string;

  @IsString()
  @IsNotEmpty()
  dni: string;
}
