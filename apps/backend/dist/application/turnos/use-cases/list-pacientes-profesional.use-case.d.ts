import { BaseUseCase } from 'src/application/shared/use-case.base';
import { ListPacientesProfesionalQueryDto, PacienteProfesionalResponseDto } from 'src/application/turnos/dtos';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class ListPacientesProfesionalUseCase implements BaseUseCase {
    private readonly turnoRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(nutricionistaId: number, query: ListPacientesProfesionalQueryDto): Promise<PacienteProfesionalResponseDto[]>;
}
