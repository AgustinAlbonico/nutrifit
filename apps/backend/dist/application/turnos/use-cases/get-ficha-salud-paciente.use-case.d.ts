import { BaseUseCase } from 'src/application/shared/use-case.base';
import { FichaSaludPacienteResponseDto } from 'src/application/turnos/dtos/ficha-salud-paciente-response.dto';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { SocioOrmEntity, TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class GetFichaSaludPacienteUseCase implements BaseUseCase {
    private readonly turnoRepository;
    private readonly socioRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, socioRepository: Repository<SocioOrmEntity>, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(nutricionistaId: number, socioId: number): Promise<FichaSaludPacienteResponseDto>;
    private hasTurnoVinculo;
}
