import { BaseUseCase } from 'src/application/shared/use-case.base';
import { ListMisTurnosQueryDto, MiTurnoResponseDto } from 'src/application/turnos/dtos';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { SocioOrmEntity, TurnoOrmEntity, UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class ListMisTurnosUseCase implements BaseUseCase {
    private readonly usuarioRepository;
    private readonly socioRepository;
    private readonly turnoRepository;
    private readonly logger;
    constructor(usuarioRepository: Repository<UsuarioOrmEntity>, socioRepository: Repository<SocioOrmEntity>, turnoRepository: Repository<TurnoOrmEntity>, logger: IAppLoggerService);
    execute(userId: number, query: ListMisTurnosQueryDto): Promise<MiTurnoResponseDto[]>;
    private resolveSocioByUserId;
}
