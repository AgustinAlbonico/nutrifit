import { Repository } from 'typeorm';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { CrearAlimentoDto } from '../dtos/crear-alimento.dto';
export declare class CrearAlimentoUseCase {
    private readonly alimentoRepo;
    private readonly grupoRepo;
    constructor(alimentoRepo: Repository<AlimentoOrmEntity>, grupoRepo: Repository<GrupoAlimenticioOrmEntity>);
    execute(dto: CrearAlimentoDto): Promise<AlimentoOrmEntity>;
}
