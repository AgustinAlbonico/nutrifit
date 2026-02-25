import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { ContextoPaciente } from '@nutrifit/shared';
export declare class PrepararContextoPacienteUseCase implements BaseUseCase {
    private readonly socioRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(socioRepository: Repository<SocioOrmEntity>, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(socioId: number): Promise<ContextoPaciente>;
    private convertirNivelActividadFisica;
    private convertirFrecuenciaComidas;
    private convertirConsumoAlcohol;
}
