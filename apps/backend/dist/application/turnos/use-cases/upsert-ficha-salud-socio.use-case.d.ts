import { BaseUseCase } from 'src/application/shared/use-case.base';
import { FichaSaludSocioResponseDto, UpsertFichaSaludSocioDto } from 'src/application/turnos/dtos';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { AlergiaOrmEntity, FichaSaludOrmEntity, PatologiaOrmEntity, SocioOrmEntity, UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class UpsertFichaSaludSocioUseCase implements BaseUseCase {
    private readonly usuarioRepository;
    private readonly socioRepository;
    private readonly fichaSaludRepository;
    private readonly alergiaRepository;
    private readonly patologiaRepository;
    private readonly logger;
    constructor(usuarioRepository: Repository<UsuarioOrmEntity>, socioRepository: Repository<SocioOrmEntity>, fichaSaludRepository: Repository<FichaSaludOrmEntity>, alergiaRepository: Repository<AlergiaOrmEntity>, patologiaRepository: Repository<PatologiaOrmEntity>, logger: IAppLoggerService);
    execute(userId: number, payload: UpsertFichaSaludSocioDto): Promise<FichaSaludSocioResponseDto>;
    private resolveSocioByUserId;
    private resolveAlergias;
    private resolvePatologias;
    private normalizeNames;
}
