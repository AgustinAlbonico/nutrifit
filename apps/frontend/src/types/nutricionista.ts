import type { Genero } from './genero';
export type { Genero };

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
  diplomaUrl: string | null;
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
}

export interface CrearNutricionistaResponseDto {
  nutricionista: Nutricionista;
  contrasenaProvisional: string;
}
