import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { NivelFormacion } from 'src/domain/entities/Certificacion/nivel-formacion';
import { CertificacionDto } from './certificacion.dto';
import { DiplomaDto } from './diploma.dto';

export class HorarioProfesionalPublicoDto {
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

export class FormacionAcademicaPublicaDto {
  titulo: string;
  institucion: string;
  anioInicio: number;
  anioFin: number | null;
  nivel: NivelFormacion;
  enCurso: boolean;
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
  fotoUrl: string | null;
  presentacion: string | null;
  duracionTurnoMin: number;
  agendaConfigurada: boolean;
  slotsProximos7Dias: number;
  diplomas: DiplomaDto[];
}

export class PerfilProfesionalPublicoResponseDto extends ProfesionalPublicoResponseDto {
  certificaciones: CertificacionDto[];
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
