import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { IAgendaRepository } from 'src/domain/entities/Agenda/agenda.repository';
import { Repository } from 'typeorm';
import { AgendaOrmEntity } from '../entities/agenda.entity';
export declare class AgendaRepositoryImplementation implements IAgendaRepository {
    private readonly agendaRepository;
    constructor(agendaRepository: Repository<AgendaOrmEntity>);
    findByNutricionistaId(nutricionistaId: number): Promise<AgendaEntity[]>;
    replaceByNutricionistaId(nutricionistaId: number, agendas: AgendaEntity[]): Promise<AgendaEntity[]>;
    private toDomainEntity;
    private toOrmEntity;
}
