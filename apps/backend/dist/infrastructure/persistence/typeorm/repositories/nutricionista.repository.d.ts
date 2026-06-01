import { Repository } from 'typeorm';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
export declare class NutricionistaRepositoryImplementation implements NutricionistaRepository {
    private readonly nutricionistaRepository;
    private readonly tenantContext?;
    constructor(nutricionistaRepository: Repository<NutricionistaOrmEntity>, tenantContext?: TenantContextService | undefined);
    private get gimnasioIdActual();
    save(entity: NutricionistaEntity): Promise<NutricionistaEntity>;
    update(id: number, entity: NutricionistaEntity): Promise<NutricionistaEntity>;
    delete(id: number): Promise<void>;
    findAll(): Promise<NutricionistaEntity[]>;
    findById(id: number): Promise<NutricionistaEntity | null>;
    findByEmail(email: string): Promise<NutricionistaEntity | null>;
    findByDni(dni: string): Promise<NutricionistaEntity | null>;
    findByMatricula(matricula: string): Promise<NutricionistaEntity | null>;
    private toOrmEntity;
    private toDomainEntity;
}
