import { ListProfesionalesPublicQueryDto, ProfesionalPublicoResponseDto } from 'src/application/profesionales/dtos';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
export declare class ListProfesionalesPublicosUseCase implements BaseUseCase {
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(query: ListProfesionalesPublicQueryDto): Promise<ProfesionalPublicoResponseDto[]>;
}
