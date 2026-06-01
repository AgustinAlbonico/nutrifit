import { BaseRepository } from 'src/domain/shared/base.repository';
import { RecepcionistaEntity } from './recepcionista.entity';
export const RECEPCIONISTA_REPOSITORY = Symbol('RecepcionistaRepository');

export abstract class RecepcionistaRepository implements BaseRepository<RecepcionistaEntity> {
  abstract save(entity: RecepcionistaEntity): Promise<RecepcionistaEntity>;
  abstract update(
    id: number,
    entity: RecepcionistaEntity,
  ): Promise<RecepcionistaEntity>;
  abstract delete(id: number): Promise<void>;
  abstract findAll(): Promise<RecepcionistaEntity[]>;
  abstract findById(id: number): Promise<RecepcionistaEntity | null>;
  abstract findByDni(dni: string): Promise<RecepcionistaEntity | null>;
}
