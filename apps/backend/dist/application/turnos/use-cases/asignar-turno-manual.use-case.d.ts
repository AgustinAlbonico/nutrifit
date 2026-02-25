import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AsignarTurnoManualDto } from 'src/application/turnos/dtos/asignar-turno-manual.dto';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos/turno-operacion-response.dto';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { AgendaOrmEntity, NutricionistaOrmEntity, SocioOrmEntity, TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class AsignarTurnoManualUseCase implements BaseUseCase {
    private readonly turnoRepository;
    private readonly socioRepository;
    private readonly nutricionistaOrmRepository;
    private readonly agendaRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, socioRepository: Repository<SocioOrmEntity>, nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>, agendaRepository: Repository<AgendaOrmEntity>, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService);
    execute(nutricionistaId: number, payload: AsignarTurnoManualDto): Promise<TurnoOperacionResponseDto>;
    private validateAgendaAvailability;
    private validateDateNotInPast;
    private mapDateToDiaSemana;
    private timeToMinutes;
    private toResponseDto;
}
