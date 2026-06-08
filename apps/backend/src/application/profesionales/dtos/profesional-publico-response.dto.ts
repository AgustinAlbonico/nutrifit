import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';

export class HorarioProfesionalPublicoDto {
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

export class FormacionAcademicaPublicaDto {
  titulo: string;
  institucion: string;
  anio: number;
}

export class ProfesionalPublicoResponseDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  matricula: string;
  ciudad: string;
  provincia: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  // Campos nuevos (spec 10 / spec 15)
  fotoUrl: string | null;
  presentacion: string | null;
  duracionTurnoMin: number;
  slotsProximos7Dias: number;
}

export class PerfilProfesionalPublicoResponseDto extends ProfesionalPublicoResponseDto {
  // matricula se hereda de ProfesionalPublicoResponseDto
  certificaciones: string | null;
  formacionAcademica: FormacionAcademicaPublicaDto[];
  horarios: HorarioProfesionalPublicoDto[];
}

export class CatalogoProfesionalResponseDto {
  items: ProfesionalPublicoResponseDto[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}
