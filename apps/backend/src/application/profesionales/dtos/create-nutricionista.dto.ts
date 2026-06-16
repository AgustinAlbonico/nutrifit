import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { IsValidDni } from 'src/infrastructure/validators/dni.validator';

export class CreateNutricionistaDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

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
  @IsValidDni()
  dni: string;

  @IsString()
  @IsNotEmpty()
  matricula: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  tarifaSesion: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  aniosExperiencia: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(5)
  @Max(240)
  duracionTurnoMin: number;

  @IsString()
  @IsOptional()
  presentacion?: string;
}
