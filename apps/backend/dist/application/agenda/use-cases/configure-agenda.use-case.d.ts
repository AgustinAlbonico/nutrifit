import { ConfigureAgendaDto } from 'src/application/agenda/dtos/configure-agenda.dto';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { IAgendaRepository } from 'src/domain/entities/Agenda/agenda.repository';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
export declare class ConfigureAgendaUseCase implements BaseUseCase {
    private readonly agendaRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(agendaRepository: IAgendaRepository, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(nutricionistaId: number, payload: ConfigureAgendaDto): Promise<AgendaEntity[]>;
    private validateAgenda;
    private timeToMinutes;
}
