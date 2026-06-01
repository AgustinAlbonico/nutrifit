import { DiaSemana } from './dia-semana';

export class AgendaEntity {
  idAgenda: number | null;
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;

  constructor(
    idAgenda: number | null,
    dia: DiaSemana,
    horaInicio: string,
    horaFin: string,
    duracionTurno: number,
  ) {
    this.idAgenda = idAgenda;
    this.dia = dia;
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
    this.duracionTurno = duracionTurno;
  }
}
