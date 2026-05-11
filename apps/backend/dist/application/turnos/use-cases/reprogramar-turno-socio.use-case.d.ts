import { BaseUseCase } from 'src/application/shared/use-case.base';
import { IPoliticaOperativaRepository } from 'src/application/politicas/politica-operativa.repository';
import { ReprogramarTurnoSocioDto, TurnoOperacionResponseDto } from 'src/application/turnos/dtos';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { AgendaOrmEntity, SocioOrmEntity, TurnoOrmEntity, UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
export declare class ReprogramarTurnoSocioUseCase implements BaseUseCase {
    private readonly usuarioRepository;
    private readonly socioRepository;
    private readonly turnoRepository;
    private readonly agendaRepository;
    private readonly logger;
    private readonly politicaRepository;
    private readonly notificacionesService;
    private readonly auditoriaService;
    constructor(usuarioRepository: Repository<UsuarioOrmEntity>, socioRepository: Repository<SocioOrmEntity>, turnoRepository: Repository<TurnoOrmEntity>, agendaRepository: Repository<AgendaOrmEntity>, logger: IAppLoggerService, politicaRepository: IPoliticaOperativaRepository, notificacionesService: NotificacionesService, auditoriaService: AuditoriaService);
    execute(userId: number, turnoId: number, payload: ReprogramarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    private resolveSocioByUserId;
    private validate24hRule;
    private validatePolicyRule;
    private validateAgendaAvailability;
    private validateDateTimeNotInPast;
    private mapDateToDiaSemana;
    private timeToMinutes;
    private toResponseDto;
}
