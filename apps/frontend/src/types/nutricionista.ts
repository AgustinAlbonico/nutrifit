import type { Genero } from './genero';
export type { Genero };

export type NivelFormacion =
  | 'GRADO'
  | 'POSGRADO'
  | 'MAESTRIA'
  | 'DOCTORADO'
  | 'ESPECIALIZACION'
  | 'DIPLOMATURA'
  | 'CURSO';

export interface DiplomaDto {
  idDiploma: number;
  url: string;
  nombreOriginal: string | null;
  mimeType: string | null;
}

export interface CertificacionDto {
  idCertificacion: number | null;
  nombre: string;
  entidad: string;
  anio: number | null;
  cargaHoraria: number | null;
  nivel: NivelFormacion | null;
}

export interface FormacionAcademicaDto {
  idFormacionAcademica: number | null;
  titulo: string;
  institucion: string;
  anioInicio: number;
  anioFin: number | null;
  nivel: NivelFormacion;
  enCurso: boolean;
}

export interface Nutricionista {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  genero: Genero;
  direccion: string;
  ciudad: string;
  provincia: string;
  matricula: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  duracionTurnoMin: number;
  email: string;
  fechaBaja: string | null;
  activo: boolean;
  fotoPerfilUrl: string | null;
  presentacion: string | null;
  certificaciones?: CertificacionDto[];
  formacionAcademica?: FormacionAcademicaDto[];
  diplomas: DiplomaDto[];
}

export interface CrearNutricionistaDto {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  genero: Genero;
  direccion: string;
  ciudad: string;
  provincia: string;
  email: string;
  matricula: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  duracionTurnoMin: number;
  presentacion?: string;
  certificaciones?: CertificacionDto[];
  formacionAcademica?: FormacionAcademicaDto[];
}

export interface CrearNutricionistaResponseDto {
  nutricionista: Nutricionista;
  contrasenaProvisional: string;
}
