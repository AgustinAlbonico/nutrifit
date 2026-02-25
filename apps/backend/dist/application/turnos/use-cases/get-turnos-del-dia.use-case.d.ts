import { BaseUseCase } from 'src/application/shared/use-case.base';
import { GetTurnosDelDiaQueryDto } from 'src/application/turnos/dtos/get-turnos-del-dia-query.dto';
import { TurnoDelDiaResponseDto } from 'src/application/turnos/dtos/turno-del-dia-response.dto';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { Repository } from 'typeorm';
export declare class GetTurnosDelDiaUseCase implements BaseUseCase {
    private readonly turnoRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(nutricionistaId: number, query: GetTurnosDelDiaQueryDto): Promise<TurnoDelDiaResponseDto[]>;
    private applyFilters;
    private validateTimeRange;
    private timeToMinutes;
}
