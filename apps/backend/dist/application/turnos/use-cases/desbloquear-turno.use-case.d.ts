import { BaseUseCase } from 'src/application/shared/use-case.base';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos/turno-operacion-response.dto';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class DesbloquearTurnoUseCase implements BaseUseCase {
    private readonly turnoRepository;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, logger: IAppLoggerService);
    execute(nutricionistaId: number, turnoId: number): Promise<TurnoOperacionResponseDto>;
    private toResponseDto;
}
