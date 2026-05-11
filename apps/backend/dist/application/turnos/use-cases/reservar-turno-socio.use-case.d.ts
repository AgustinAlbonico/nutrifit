import { BaseUseCase } from 'src/application/shared/use-case.base';
import { ReservarTurnoSocioDto, TurnoOperacionResponseDto } from 'src/application/turnos/dtos';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { AgendaOrmEntity, NutricionistaOrmEntity, SocioOrmEntity, TurnoOrmEntity, UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
export declare class ReservarTurnoSocioUseCase implements BaseUseCase {
    private readonly usuarioRepository;
    private readonly socioRepository;
    private readonly nutricionistaOrmRepository;
    private readonly agendaRepository;
    private readonly turnoRepository;
    private readonly nutricionistaRepository;
    private readonly logger;
    private readonly notificacionesService;
    constructor(usuarioRepository: Repository<UsuarioOrmEntity>, socioRepository: Repository<SocioOrmEntity>, nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>, agendaRepository: Repository<AgendaOrmEntity>, turnoRepository: Repository<TurnoOrmEntity>, nutricionistaRepository: NutricionistaRepository, logger: IAppLoggerService, notificacionesService: NotificacionesService);
    execute(userId: number, payload: ReservarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    private resolveSocioByUserId;
    private validateAgendaAvailability;
    private validateDateTimeNotInPast;
    private mapDateToDiaSemana;
    private timeToMinutes;
    private toResponseDto;
}
