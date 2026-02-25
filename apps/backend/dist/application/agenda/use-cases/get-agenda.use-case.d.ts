import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { IAgendaRepository } from 'src/domain/entities/Agenda/agenda.repository';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
export declare class GetAgendaUseCase implements BaseUseCase {
    private readonly agendaRepository;
    private readonly nutricionistaRepository;
    constructor(agendaRepository: IAgendaRepository, nutricionistaRepository: NutricionistaRepository);
    execute(nutricionistaId: number): Promise<AgendaEntity[]>;
}
