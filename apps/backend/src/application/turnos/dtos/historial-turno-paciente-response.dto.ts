import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

export class HistorialTurnoPacienteResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  tieneMedicion: boolean;
  tieneObservacion: boolean;
  cantidadAdjuntos: number;
  cantidadFotos: number;
}
