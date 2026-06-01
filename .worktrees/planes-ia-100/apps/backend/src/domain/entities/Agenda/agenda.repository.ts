import { AgendaEntity } from './agenda.entity';

export const AGENDA_REPOSITORY = Symbol('AgendaRepository');

export abstract class IAgendaRepository {
  abstract findByNutricionistaId(
    nutricionistaId: number,
  ): Promise<AgendaEntity[]>;

  abstract replaceByNutricionistaId(
    nutricionistaId: number,
    agendas: AgendaEntity[],
  ): Promise<AgendaEntity[]>;
}
