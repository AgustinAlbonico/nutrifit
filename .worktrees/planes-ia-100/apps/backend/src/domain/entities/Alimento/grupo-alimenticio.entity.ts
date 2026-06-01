export class GrupoAlimenticio {
  idGrupoAlimenticio: number | null;
  descripcion: string;

  constructor(idGrupoAlimenticio: number | null = null, descripcion: string) {
    this.idGrupoAlimenticio = idGrupoAlimenticio;
    this.descripcion = descripcion;
  }
}
