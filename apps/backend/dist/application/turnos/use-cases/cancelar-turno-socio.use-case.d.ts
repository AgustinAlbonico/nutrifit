import { BaseUseCase } from 'src/application/shared/use-case.base';
import { IPoliticaOperativaRepository } from 'src/application/politicas/politica-operativa.repository';
import { CancelarTurnoSocioDto, TurnoOperacionResponseDto } from 'src/application/turnos/dtos';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { SocioOrmEntity, TurnoConfirmacionTokenOrmEntity, TurnoOrmEntity, UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
export declare class CancelarTurnoSocioUseCase implements BaseUseCase {
    private readonly usuarioRepository;
    private readonly socioRepository;
    private readonly turnoRepository;
    private readonly tokenRepository;
    private readonly notificacionesService;
    private readonly logger;
    private readonly politicaRepository;
    private readonly auditoriaService;
    constructor(usuarioRepository: Repository<UsuarioOrmEntity>, socioRepository: Repository<SocioOrmEntity>, turnoRepository: Repository<TurnoOrmEntity>, tokenRepository: Repository<TurnoConfirmacionTokenOrmEntity>, notificacionesService: NotificacionesService, logger: IAppLoggerService, politicaRepository: IPoliticaOperativaRepository, auditoriaService: AuditoriaService);
    execute(userId: number | null, turnoId: number, tokenConfirmacion?: string, dto?: CancelarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    private validarTokenConfirmacion;
    private resolveSocioByUserId;
    private validate24hRule;
    private validatePolicyRule;
    private toResponseDto;
}
