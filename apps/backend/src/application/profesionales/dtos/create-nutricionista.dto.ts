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
import { NivelFormacion } from 'src/domain/entities/Certificacion/nivel-formacion';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { IsValidDni } from 'src/infrastructure/validators/dni.validator';

export interface FormacionAcademicaPayloadDto {
  idFormacionAcademica?: number | null;
  titulo: string;
  institucion: string;
  anioInicio: number;
  anioFin: number | null;
  nivel: NivelFormacion;
}

export interface CertificacionPayloadDto {
  idCertificacion?: number | null;
  nombre: string;
  entidad: string;
  anio: number | null;
  cargaHoraria: number | null;
  nivel: NivelFormacion | null;
}

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

  @IsOptional()
  formacionAcademica?: FormacionAcademicaPayloadDto[] | string;

  @IsOptional()
  certificaciones?: CertificacionPayloadDto[] | string;
}
