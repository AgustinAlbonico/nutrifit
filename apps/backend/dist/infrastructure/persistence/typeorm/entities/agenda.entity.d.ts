import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { NutricionistaOrmEntity } from './persona.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class AgendaOrmEntity extends AuditableOrmEntity {
    idAgenda: number;
    dia: DiaSemana;
    horaInicio: string;
    horaFin: string;
    duracionTurno: number;
    nutricionista: NutricionistaOrmEntity;
}
