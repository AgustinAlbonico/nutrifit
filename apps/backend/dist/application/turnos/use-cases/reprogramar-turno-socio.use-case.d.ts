import { BaseUseCase } from 'src/application/shared/use-case.base';
import { ReprogramarTurnoSocioDto, TurnoOperacionResponseDto } from 'src/application/turnos/dtos';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { AgendaOrmEntity, SocioOrmEntity, TurnoOrmEntity, UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class ReprogramarTurnoSocioUseCase implements BaseUseCase {
    private readonly usuarioRepository;
    private readonly socioRepository;
    private readonly turnoRepository;
    private readonly agendaRepository;
    private readonly logger;
    constructor(usuarioRepository: Repository<UsuarioOrmEntity>, socioRepository: Repository<SocioOrmEntity>, turnoRepository: Repository<TurnoOrmEntity>, agendaRepository: Repository<AgendaOrmEntity>, logger: IAppLoggerService);
    execute(userId: number, turnoId: number, payload: ReprogramarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    private resolveSocioByUserId;
    private validate24hRule;
    private validateAgendaAvailability;
    private validateDateTimeNotInPast;
    private mapDateToDiaSemana;
    private timeToMinutes;
    private toResponseDto;
}
