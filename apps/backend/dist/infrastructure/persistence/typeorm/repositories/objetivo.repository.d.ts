import { EstadoObjetivo, TipoMetrica } from 'src/domain/entities/Objetivo/objetivo.entity';
import { Repository } from 'typeorm';
import { ObjetivoOrmEntity } from '../entities/objetivo.entity';
export declare class ObjetivoRepository {
    private readonly objetivoRepository;
    constructor(objetivoRepository: Repository<ObjetivoOrmEntity>);
    findById(idObjetivo: number): Promise<ObjetivoOrmEntity | null>;
    findActivosBySocioId(socioId: number): Promise<ObjetivoOrmEntity[]>;
    findCompletadosBySocioId(socioId: number): Promise<ObjetivoOrmEntity[]>;
    findActivoByTipo(socioId: number, tipoMetrica: TipoMetrica): Promise<ObjetivoOrmEntity | null>;
    save(entity: Partial<ObjetivoOrmEntity>): Promise<ObjetivoOrmEntity>;
    updateEstado(idObjetivo: number, estado: EstadoObjetivo): Promise<void>;
}
