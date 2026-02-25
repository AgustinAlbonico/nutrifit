import { BaseUseCase } from 'src/application/shared/use-case.base';
import { PerfilProfesionalPublicoResponseDto } from 'src/application/profesionales/dtos';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
export declare class GetPerfilProfesionalPublicoUseCase implements BaseUseCase {
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(id: number): Promise<PerfilProfesionalPublicoResponseDto>;
}
