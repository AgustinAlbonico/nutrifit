import { NivelFormacion } from 'src/domain/entities/Certificacion/nivel-formacion';
import { CertificacionDto } from './certificacion.dto';
import { DiplomaDto } from './diploma.dto';

export class FormacionAcademicaNutricionistaDto {
  idFormacionAcademica: number | null;
  titulo: string;
  institucion: string;
  anioInicio: number;
  anioFin: number | null;
  nivel: NivelFormacion;
  enCurso: boolean;
}

export class NutricionistaResponseDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  telefono: string;
  genero: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  dni: string;
  matricula: string;
  tarifaSesion: number;
  aniosExperiencia: number;
  duracionTurnoMin: number;
  email: string;
  fechaBaja: Date | null;
  activo: boolean;
  fotoPerfilUrl: string | null;
  presentacion: string | null;
  certificaciones: CertificacionDto[];
  formacionAcademica: FormacionAcademicaNutricionistaDto[];
  diplomas: DiplomaDto[];
  contrasenaProvisional?: string;
}
