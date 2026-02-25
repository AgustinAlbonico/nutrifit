import { Repository } from 'typeorm';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
export declare class NutricionistaRepositoryImplementation implements NutricionistaRepository {
    private readonly nutricionistaRepository;
    constructor(nutricionistaRepository: Repository<NutricionistaOrmEntity>);
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
