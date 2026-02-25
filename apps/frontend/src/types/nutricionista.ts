export type Genero = 'MASCULINO' | 'FEMENINO' | 'OTRO';

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
  añosExperiencia: number;
  tarifaSesion: number;
  email: string;
  fechaBaja: string | null;
  activo: boolean;
  fotoPerfilUrl: string | null;
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
  añosExperiencia: number;
  tarifaSesion: number;
  contrasena: string;
}
