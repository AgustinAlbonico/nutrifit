import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { Repository } from 'typeorm';
export declare class ReactivarNutricionistaUseCase implements BaseUseCase {
    private readonly nutricionistaRepository;
    private readonly logger;
    private readonly nutricionistaOrmRepository;
    constructor(nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService, nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>);
    execute(id: number): Promise<void>;
}
