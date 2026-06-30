import { AuditableEntity } from '../../shared/auditable.entity';
import { PreparacionItemEntity } from './preparacion-item.entity';

export class PreparacionEntity extends AuditableEntity {
  idPreparacion: number | null;
  nombre: string;
  gimnasioId: number;
  creadoPorId: number;
  items: PreparacionItemEntity[];

  constructor(
    idPreparacion: number | null = null,
    nombre: string,
    gimnasioId: number,
    creadoPorId: number,
    items: PreparacionItemEntity[] = [],
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idPreparacion = idPreparacion;
    this.nombre = nombre;
    this.gimnasioId = gimnasioId;
    this.creadoPorId = creadoPorId;
    this.items = items;
  }
}
