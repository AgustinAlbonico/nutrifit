import { BaseRepository } from 'src/domain/shared/base.repository';
import { ExcepcionDisponibilidadEntity } from './excepcion-disponibilidad.entity';
export const EXCEPCION_DISPONIBILIDAD_REPOSITORY = Symbol(
  'ExcepcionDisponibilidadRepository',
);

export abstract class ExcepcionDisponibilidadRepository
  implements BaseRepository<ExcepcionDisponibilidadEntity>
{
  abstract save(entity: ExcepcionDisponibilidadEntity): Promise<ExcepcionDisponibilidadEntity>;
  abstract update(
    id: number,
    entity: ExcepcionDisponibilidadEntity,
  ): Promise<ExcepcionDisponibilidadEntity>;
  abstract delete(id: number): Promise<void>;
  abstract findAll(): Promise<ExcepcionDisponibilidadEntity[]>;
  abstract findById(id: number): Promise<ExcepcionDisponibilidadEntity | null>;
  /**
   * Devuelve las excepciones vigentes que solapen el rango [fechaDesde, fechaHasta]
   * (fechaInicio <= fechaHasta AND fechaFin > fechaDesde).
   */
  abstract findVigentesEnVentana(
    nutricionistaId: number,
    fechaDesde: Date,
    fechaHasta: Date,
  ): Promise<ExcepcionDisponibilidadEntity[]>;
}
