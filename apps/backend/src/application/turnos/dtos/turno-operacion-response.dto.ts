import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

export class TurnoOperacionResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  socioId: number;
  nutricionistaId: number;
}
