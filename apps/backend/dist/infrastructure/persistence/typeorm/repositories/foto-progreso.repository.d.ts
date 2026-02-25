import { Repository } from 'typeorm';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
import { FotoProgresoOrmEntity } from '../entities/foto-progreso.entity';
export declare class FotoProgresoRepository {
    private readonly fotoProgresoOrmRepository;
    constructor(fotoProgresoOrmRepository: Repository<FotoProgresoOrmEntity>);
    findBySocioId(socioId: number): Promise<FotoProgresoOrmEntity[]>;
    findBySocioIdAndTipo(socioId: number, tipoFoto: TipoFoto): Promise<FotoProgresoOrmEntity[]>;
    findLatestBySocioId(socioId: number): Promise<FotoProgresoOrmEntity[]>;
    findByIdAndSocioId(idFoto: number, socioId: number): Promise<FotoProgresoOrmEntity | null>;
    save(entity: Partial<FotoProgresoOrmEntity>): Promise<FotoProgresoOrmEntity>;
    delete(idFoto: number): Promise<void>;
}
