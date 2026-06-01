import { AuditableEntity } from '../../shared/auditable.entity';

export class GrupoAlimenticio extends AuditableEntity {
  idGrupoAlimenticio: number | null;
  descripcion: string;

  constructor(
    idGrupoAlimenticio: number | null = null,
    descripcion: string,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idGrupoAlimenticio = idGrupoAlimenticio;
    this.descripcion = descripcion;
  }
}
