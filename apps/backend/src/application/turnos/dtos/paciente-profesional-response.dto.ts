import { Genero } from 'src/domain/entities/Persona/Genero';

export class PacienteProfesionalResponseDto {
  socioId: number;
  nombreCompleto: string;
  dni: string;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  genero: Genero | null;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  objetivo: string | null;
  ultimoTurno: string | null;
  proximoTurno: string | null;
  fotoPerfilUrl: string | null;
}
