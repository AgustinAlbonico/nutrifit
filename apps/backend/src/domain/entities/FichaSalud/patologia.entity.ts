import { AuditableEntity } from '../../shared/auditable.entity';

export class PatologiaEntity extends AuditableEntity {
  idPatologia: number | null;
  nombre: string;

  constructor(
    idPatologia: number | null = null,
    nombre: string,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idPatologia = idPatologia;
    this.nombre = nombre;
  }
}
