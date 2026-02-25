import { BaseUseCase } from 'src/application/shared/use-case.base';
import { BloquearTurnoDto } from 'src/application/turnos/dtos/bloquear-turno.dto';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos/turno-operacion-response.dto';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { AgendaOrmEntity, NutricionistaOrmEntity, TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class BloquearTurnoUseCase implements BaseUseCase {
    private readonly nutricionistaOrmRepository;
    private readonly agendaRepository;
    private readonly turnoRepository;
    private readonly logger;
    constructor(nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>, agendaRepository: Repository<AgendaOrmEntity>, turnoRepository: Repository<TurnoOrmEntity>, logger: IAppLoggerService);
    execute(nutricionistaId: number, payload: BloquearTurnoDto): Promise<TurnoOperacionResponseDto>;
    private validateAgendaAvailability;
    private validateDateNotInPast;
    private mapDateToDiaSemana;
    private timeToMinutes;
    private toResponseDto;
}
