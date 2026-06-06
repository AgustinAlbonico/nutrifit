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
  /**
   * RB15: `true` si la ficha de salud del socio fue actualizada
   * despues de la ultima consulta del par (nutricionista, socio).
   */
  fichaActualizada: boolean;
  /**
   * Id de la observacion clinica del turno (si existe). Permite al
   * frontend enlazar el form de consulta sin pedirlo por separado.
   */
  consultaId: number | null;
}
