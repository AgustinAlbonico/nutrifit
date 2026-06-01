import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { IAgendaRepository } from 'src/domain/entities/Agenda/agenda.repository';
import { Repository } from 'typeorm';
import { AgendaOrmEntity } from '../entities/agenda.entity';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
export declare class AgendaRepositoryImplementation implements IAgendaRepository {
    private readonly agendaRepository;
    private readonly nutricionistaRepository;
    private readonly tenantContext?;
    constructor(agendaRepository: Repository<AgendaOrmEntity>, nutricionistaRepository: Repository<NutricionistaOrmEntity>, tenantContext?: TenantContextService | undefined);
    findByNutricionistaId(nutricionistaId: number): Promise<AgendaEntity[]>;
    replaceByNutricionistaId(nutricionistaId: number, agendas: AgendaEntity[]): Promise<AgendaEntity[]>;
    private toDomainEntity;
    private toOrmEntity;
}
