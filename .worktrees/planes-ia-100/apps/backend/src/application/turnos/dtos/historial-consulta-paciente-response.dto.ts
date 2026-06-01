import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

export class HistorialConsultaPacienteResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  tipoConsulta: string;
  notasProfesional: string | null;
  sugerencias: string | null;
  esPublica: boolean;
  archivosAdjuntos: string[];
}
