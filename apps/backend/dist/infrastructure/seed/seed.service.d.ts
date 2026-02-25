import { Repository } from 'typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';
export declare class SeedService {
    private readonly grupoRepository;
    private readonly accionRepository;
    private readonly logger;
    constructor(grupoRepository: Repository<GrupoPermisoOrmEntity>, accionRepository: Repository<AccionOrmEntity>);
    seedPermisos(): Promise<void>;
}
