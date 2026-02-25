import { Repository } from 'typeorm';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { ActualizarAlimentoDto } from '../dtos/actualizar-alimento.dto';
export declare class ActualizarAlimentoUseCase {
    private readonly alimentoRepo;
    private readonly grupoRepo;
    constructor(alimentoRepo: Repository<AlimentoOrmEntity>, grupoRepo: Repository<GrupoAlimenticioOrmEntity>);
    execute(id: number, dto: ActualizarAlimentoDto): Promise<AlimentoOrmEntity>;
}
