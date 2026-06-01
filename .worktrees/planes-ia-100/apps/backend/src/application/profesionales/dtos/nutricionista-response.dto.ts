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
  añosExperiencia: number;
  email: string;
  fechaBaja: Date | null;
  activo: boolean;
  fotoPerfilUrl: string | null;
}
