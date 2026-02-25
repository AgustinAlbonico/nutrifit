import { BaseRepository } from 'src/domain/shared/base.repository';
import { NutricionistaEntity } from './nutricionista.entity';
export declare const NUTRICIONISTA_REPOSITORY: unique symbol;
export declare abstract class NutricionistaRepository implements BaseRepository<NutricionistaEntity> {
    abstract save(entity: NutricionistaEntity): Promise<NutricionistaEntity>;
    abstract update(id: number, entity: NutricionistaEntity): Promise<NutricionistaEntity>;
    abstract delete(id: number): Promise<void>;
    abstract findAll(): Promise<NutricionistaEntity[]>;
    abstract findById(id: number): Promise<NutricionistaEntity | null>;
    abstract findByEmail(email: string): Promise<NutricionistaEntity | null>;
    abstract findByDni(dni: string): Promise<NutricionistaEntity | null>;
    abstract findByMatricula(matricula: string): Promise<NutricionistaEntity | null>;
}
