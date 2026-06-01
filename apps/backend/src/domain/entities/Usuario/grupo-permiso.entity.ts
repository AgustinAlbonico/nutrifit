import { AccionPermisoEntity } from './accion-permiso.entity';
import { AuditableEntity } from '../../shared/auditable.entity';

export class GrupoPermisoEntity extends AuditableEntity {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  acciones: AccionPermisoEntity[];
  hijos: GrupoPermisoEntity[];

  constructor(
    id: number,
    clave: string,
    nombre: string,
    descripcion: string | null = null,
    acciones: AccionPermisoEntity[] = [],
    hijos: GrupoPermisoEntity[] = [],
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.id = id;
    this.clave = clave;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.acciones = acciones;
    this.hijos = hijos;
  }
}
