import { BaseUseCase } from 'src/application/shared/use-case.base';
import { RecepcionTurnoResponseDto } from 'src/application/turnos/dtos/recepcion-turno-response.dto';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { Repository } from 'typeorm';
export declare class GetTurnosRecepcionDiaUseCase implements BaseUseCase {
    private readonly turnoRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(fecha?: string): Promise<RecepcionTurnoResponseDto[]>;
}
