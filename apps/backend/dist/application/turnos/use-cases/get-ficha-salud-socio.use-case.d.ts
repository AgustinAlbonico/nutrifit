import { BaseUseCase } from 'src/application/shared/use-case.base';
import { FichaSaludSocioResponseDto } from 'src/application/turnos/dtos';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { SocioOrmEntity, UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class GetFichaSaludSocioUseCase implements BaseUseCase {
    private readonly usuarioRepository;
    private readonly socioRepository;
    private readonly logger;
    constructor(usuarioRepository: Repository<UsuarioOrmEntity>, socioRepository: Repository<SocioOrmEntity>, logger: IAppLoggerService);
    execute(userId: number): Promise<FichaSaludSocioResponseDto | null>;
    private resolveSocioByUserId;
}
