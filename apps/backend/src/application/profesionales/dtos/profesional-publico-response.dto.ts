import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';

export class HorarioProfesionalPublicoDto {
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

export class ProfesionalPublicoResponseDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  ciudad: string;
  provincia: string;
  añosExperiencia: number;
  tarifaSesion: number;
}

export class PerfilProfesionalPublicoResponseDto extends ProfesionalPublicoResponseDto {
  matricula: string;
  email: string;
  telefono: string;
  direccion: string;
  genero: string;
  biografia: string | null;
  calificacionPromedio: number | null;
  totalOpiniones: number;
  horarios: HorarioProfesionalPublicoDto[];
}
