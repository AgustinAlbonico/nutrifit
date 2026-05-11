import { Repository } from 'typeorm';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { IPoliticaOperativaRepository } from 'src/application/politicas/politica-operativa.repository';
export declare class AusenciaTurnoScheduler {
    private readonly turnoRepository;
    private readonly politicaRepository;
    private readonly logger;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, politicaRepository: IPoliticaOperativaRepository);
    marcarAusentesAutomaticos(): Promise<void>;
}
