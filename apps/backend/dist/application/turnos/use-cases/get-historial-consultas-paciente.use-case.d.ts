import { BaseUseCase } from 'src/application/shared/use-case.base';
import { HistorialConsultaPacienteResponseDto } from 'src/application/turnos/dtos/historial-consulta-paciente-response.dto';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { SocioOrmEntity, TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class GetHistorialConsultasPacienteUseCase implements BaseUseCase {
    private readonly turnoRepository;
    private readonly socioRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, socioRepository: Repository<SocioOrmEntity>, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(nutricionistaId: number, socioId: number): Promise<HistorialConsultaPacienteResponseDto[]>;
    private hasTurnoVinculo;
}
