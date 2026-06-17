import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Genero } from 'src/domain/entities/Persona/Genero';

export const ESTADO_SOCIO = ['ACTIVO', 'INACTIVO'] as const;
export type EstadoSocio = (typeof ESTADO_SOCIO)[number];

export class RegistrarSocioDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  dni?: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefono?: string;

  @IsEnum(Genero)
  @IsOptional()
  genero?: Genero;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  direccion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  ciudad?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  provincia?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  observaciones?: string;

  @IsIn(ESTADO_SOCIO)
  @IsOptional()
  estado?: EstadoSocio;
}
