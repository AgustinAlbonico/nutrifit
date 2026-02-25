import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { NutricionistaOrmEntity } from './persona.entity';
export declare class AgendaOrmEntity {
    idAgenda: number;
    dia: DiaSemana;
    horaInicio: string;
    horaFin: string;
    duracionTurno: number;
    nutricionista: NutricionistaOrmEntity;
}
