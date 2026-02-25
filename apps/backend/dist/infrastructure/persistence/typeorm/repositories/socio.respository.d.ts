import { Repository } from 'typeorm';
import { SocioOrmEntity } from '../entities/persona.entity';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
export declare class SocioRepositoryImplementation implements SocioRepository {
    private readonly socioRepository;
    constructor(socioRepository: Repository<SocioOrmEntity>);
    save(entity: SocioEntity): Promise<SocioEntity>;
    update(id: number, entity: SocioEntity): Promise<SocioEntity>;
    delete(id: number): Promise<void>;
    reactivar(id: number): Promise<void>;
    findAll(): Promise<SocioEntity[]>;
    findById(id: number): Promise<SocioEntity | null>;
    private toOrmEntity;
    private toEntity;
}
