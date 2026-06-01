import { DiaSemana } from './dia-semana';
import { AuditableEntity } from "../../shared/auditable.entity";
export declare class AgendaEntity extends AuditableEntity {
    idAgenda: number | null;
    dia: DiaSemana;
    horaInicio: string;
    horaFin: string;
    duracionTurno: number;
    constructor(idAgenda: number | null, dia: DiaSemana, horaInicio: string, horaFin: string, duracionTurno: number, fechaBaja?: Date | null);
}
