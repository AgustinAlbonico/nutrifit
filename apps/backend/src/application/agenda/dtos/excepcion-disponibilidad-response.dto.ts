export interface TurnoAfectadoResumenDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  socioId: number | null;
  socioNombre: string | null;
}

export class ExcepcionDisponibilidadResponseDto {
  idExcepcion: number;
  fechaInicio: string;
  fechaFin: string;
  motivo: string | null;
  turnosAfectados?: TurnoAfectadoResumenDto[];
}
