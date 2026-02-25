import { Repository } from 'typeorm';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { EnvironmentConfigService } from '../config/environment-config/environment-config.service';
export declare class AusenciaTurnoScheduler {
    private readonly turnoRepository;
    private readonly configService;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, configService: EnvironmentConfigService);
    marcarAusentesAutomaticos(): Promise<void>;
}
