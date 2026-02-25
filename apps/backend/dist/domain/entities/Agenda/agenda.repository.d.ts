import { AgendaEntity } from './agenda.entity';
export declare const AGENDA_REPOSITORY: unique symbol;
export declare abstract class IAgendaRepository {
    abstract findByNutricionistaId(nutricionistaId: number): Promise<AgendaEntity[]>;
    abstract replaceByNutricionistaId(nutricionistaId: number, agendas: AgendaEntity[]): Promise<AgendaEntity[]>;
}
