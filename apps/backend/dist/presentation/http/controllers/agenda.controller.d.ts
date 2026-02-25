import { AgendaResponseDto, ConfigureAgendaDto } from 'src/application/agenda/dtos';
import { ConfigureAgendaUseCase, GetAgendaUseCase } from 'src/application/agenda/use-cases';
import { IAppLoggerService } from 'src/domain/services/logger.service';
export declare class AgendaController {
    private readonly configureAgendaUseCase;
    private readonly getAgendaUseCase;
    private readonly logger;
    constructor(configureAgendaUseCase: ConfigureAgendaUseCase, getAgendaUseCase: GetAgendaUseCase, logger: IAppLoggerService);
    configureAgenda(nutricionistaId: number, configureAgendaDto: ConfigureAgendaDto): Promise<AgendaResponseDto[]>;
    getAgendaByNutricionista(nutricionistaId: number): Promise<AgendaResponseDto[]>;
    private toResponseDto;
}
