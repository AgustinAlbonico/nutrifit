import { BaseUseCase } from 'src/application/shared/use-case.base';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { SocioOrmEntity, TurnoConfirmacionTokenOrmEntity, TurnoOrmEntity, UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
export declare class ConfirmarTurnoSocioUseCase implements BaseUseCase {
    private readonly usuarioRepository;
    private readonly socioRepository;
    private readonly turnoRepository;
    private readonly tokenRepository;
    private readonly notificacionesService;
    private readonly logger;
    constructor(usuarioRepository: Repository<UsuarioOrmEntity>, socioRepository: Repository<SocioOrmEntity>, turnoRepository: Repository<TurnoOrmEntity>, tokenRepository: Repository<TurnoConfirmacionTokenOrmEntity>, notificacionesService: NotificacionesService, logger: IAppLoggerService);
    execute(userId: number | null, turnoId: number, tokenConfirmacion?: string): Promise<TurnoOperacionResponseDto>;
    private validarTokenConfirmacion;
    private resolveSocioByUserId;
    private validateConfirmationWindow;
    private toResponseDto;
}
