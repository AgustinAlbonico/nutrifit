import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

export class RecepcionTurnoResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  nombreSocio: string;
  nombreNutricionista: string;
  dniSocio: string;
}
