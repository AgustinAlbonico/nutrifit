import { DiaSemana } from './dia-semana';
import { AuditableEntity } from '../../shared/auditable.entity';

export class AgendaEntity extends AuditableEntity {
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
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idAgenda = idAgenda;
    this.dia = dia;
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
    this.duracionTurno = duracionTurno;
  }
}
