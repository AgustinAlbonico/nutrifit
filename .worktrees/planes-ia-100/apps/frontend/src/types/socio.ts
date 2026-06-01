export type Genero = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface Socio {
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
  email: string;
  fechaBaja: string | null;
  activo: boolean;
  fotoPerfilUrl: string | null;
}

export interface CrearSocioDto {
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
  contrasena: string;
}
