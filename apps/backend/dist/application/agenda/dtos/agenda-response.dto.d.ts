import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
export declare class AgendaResponseDto {
    idAgenda: number;
    dia: DiaSemana;
    horaInicio: string;
    horaFin: string;
    duracionTurno: number;
}
