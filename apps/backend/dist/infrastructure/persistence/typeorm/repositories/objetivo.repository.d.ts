import { EstadoObjetivo, TipoMetrica } from 'src/domain/entities/Objetivo/objetivo.entity';
import { Repository } from 'typeorm';
import { ObjetivoOrmEntity } from '../entities/objetivo.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
export declare class ObjetivoRepository {
    private readonly objetivoRepository;
    private readonly tenantContext?;
    constructor(objetivoRepository: Repository<ObjetivoOrmEntity>, tenantContext?: TenantContextService | undefined);
    private get gimnasioIdActual();
    findById(idObjetivo: number): Promise<ObjetivoOrmEntity | null>;
    findActivosBySocioId(socioId: number): Promise<ObjetivoOrmEntity[]>;
    findCompletadosBySocioId(socioId: number): Promise<ObjetivoOrmEntity[]>;
    findActivoByTipo(socioId: number, tipoMetrica: TipoMetrica): Promise<ObjetivoOrmEntity | null>;
    save(entity: Partial<ObjetivoOrmEntity>): Promise<ObjetivoOrmEntity>;
    updateEstado(idObjetivo: number, estado: EstadoObjetivo): Promise<void>;
}
