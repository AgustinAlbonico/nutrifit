import { BaseRepository } from 'src/domain/shared/base.repository';
import { SocioEntity } from './socio.entity';

export const SOCIO_REPOSITORY = Symbol('SocioRepository');

export abstract class SocioRepository implements BaseRepository<SocioEntity> {
  abstract save(entity: SocioEntity): Promise<SocioEntity>;
  abstract update(id: number, entity: SocioEntity): Promise<SocioEntity>;
  abstract delete(id: number): Promise<void>;
  abstract reactivar(id: number): Promise<void>;
  abstract findAll(): Promise<SocioEntity[]>;
  abstract findById(id: number): Promise<SocioEntity | null>;
}
