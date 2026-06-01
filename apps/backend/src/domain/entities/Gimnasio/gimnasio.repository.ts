import { BaseRepository } from 'src/domain/shared/base.repository';
import { GimnasioEntity } from './gimnasio.entity';

export const GIMNASIO_REPOSITORY = Symbol('IGimnasioRepository');

export interface CrearGimnasioDto {
  nombre: string;
  direccion: string;
  telefono?: string | null;
  email?: string | null;
}

export interface ActualizarGimnasioDto {
  nombre?: string;
  direccion?: string;
  telefono?: string | null;
  email?: string | null;
}

export abstract class GimnasioRepository implements BaseRepository<GimnasioEntity> {
  abstract findAll(): Promise<GimnasioEntity[]>;
  abstract findById(id: number): Promise<GimnasioEntity | null>;
  abstract save(entity: GimnasioEntity): Promise<GimnasioEntity>;
  abstract update(id: number, entity: Partial<GimnasioEntity>): Promise<GimnasioEntity>;
  abstract delete(id: number): Promise<void>;
  abstract findByNombre(nombre: string): Promise<GimnasioEntity | null>;
  abstract findActivos(): Promise<GimnasioEntity[]>;
}