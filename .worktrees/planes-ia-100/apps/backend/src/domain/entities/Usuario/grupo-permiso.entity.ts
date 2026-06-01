import { AccionPermisoEntity } from './accion-permiso.entity';

export class GrupoPermisoEntity {
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
  ) {
    this.id = id;
    this.clave = clave;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.acciones = acciones;
    this.hijos = hijos;
  }
}
