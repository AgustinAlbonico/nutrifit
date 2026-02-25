import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

export class SocioTurnoDelDiaResponseDto {
  idPersona: number;
  nombreCompleto: string;
  dni: string;
  objetivo: string | null;
}

export class TurnoDelDiaResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  tipoConsulta: string;
  socio: SocioTurnoDelDiaResponseDto;
}
