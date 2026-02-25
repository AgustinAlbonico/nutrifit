import { Repository } from 'typeorm';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
export declare class EliminarAlimentoUseCase {
    private readonly alimentoRepo;
    constructor(alimentoRepo: Repository<AlimentoOrmEntity>);
    execute(id: number): Promise<void>;
}
