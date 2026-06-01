export class AccionPermisoEntity {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;

  constructor(
    id: number,
    clave: string,
    nombre: string,
    descripcion: string | null = null,
  ) {
    this.id = id;
    this.clave = clave;
    this.nombre = nombre;
    this.descripcion = descripcion;
  }
}
