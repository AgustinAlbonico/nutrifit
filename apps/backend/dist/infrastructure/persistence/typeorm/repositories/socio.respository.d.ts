import { Repository } from 'typeorm';
import { SocioOrmEntity } from '../entities/persona.entity';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
export declare class SocioRepositoryImplementation implements SocioRepository {
    private readonly socioRepository;
    private readonly tenantContext?;
    constructor(socioRepository: Repository<SocioOrmEntity>, tenantContext?: TenantContextService | undefined);
    private get gimnasioIdActual();
    save(entity: SocioEntity): Promise<SocioEntity>;
    update(id: number, entity: SocioEntity): Promise<SocioEntity>;
    delete(id: number): Promise<void>;
    reactivar(id: number): Promise<void>;
    findAll(): Promise<SocioEntity[]>;
    findById(id: number): Promise<SocioEntity | null>;
    private toOrmEntity;
    private toEntity;
}
