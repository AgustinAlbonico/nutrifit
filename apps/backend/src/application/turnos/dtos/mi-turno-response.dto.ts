import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

export class MiTurnoResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  profesionalId: number;
  profesionalNombreCompleto: string;
  especialidad: string;
}
