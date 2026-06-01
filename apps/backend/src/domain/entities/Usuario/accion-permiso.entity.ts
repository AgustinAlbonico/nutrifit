import { AuditableEntity } from '../../shared/auditable.entity';

export class AccionPermisoEntity extends AuditableEntity {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;

  constructor(
    id: number,
    clave: string,
    nombre: string,
    descripcion: string | null = null,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.id = id;
    this.clave = clave;
    this.nombre = nombre;
    this.descripcion = descripcion;
  }
}
