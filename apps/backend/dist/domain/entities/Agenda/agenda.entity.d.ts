import { DiaSemana } from './dia-semana';
export declare class AgendaEntity {
    idAgenda: number | null;
    dia: DiaSemana;
    horaInicio: string;
    horaFin: string;
    duracionTurno: number;
    constructor(idAgenda: number | null, dia: DiaSemana, horaInicio: string, horaFin: string, duracionTurno: number);
}
