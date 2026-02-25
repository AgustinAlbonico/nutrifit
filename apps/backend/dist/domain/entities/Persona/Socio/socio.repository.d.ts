import { BaseRepository } from 'src/domain/shared/base.repository';
import { SocioEntity } from './socio.entity';
export declare const SOCIO_REPOSITORY: unique symbol;
export declare abstract class SocioRepository implements BaseRepository<SocioEntity> {
    abstract save(entity: SocioEntity): Promise<SocioEntity>;
    abstract update(id: number, entity: SocioEntity): Promise<SocioEntity>;
    abstract delete(id: number): Promise<void>;
    abstract reactivar(id: number): Promise<void>;
    abstract findAll(): Promise<SocioEntity[]>;
    abstract findById(id: number): Promise<SocioEntity | null>;
}
