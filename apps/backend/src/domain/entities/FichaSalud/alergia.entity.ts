import { AuditableEntity } from '../../shared/auditable.entity';

export class AlergiaEntity extends AuditableEntity {
  idAlergia: number | null;
  nombre: string;

  constructor(
    idAlergia: number | null = null,
    nombre: string,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idAlergia = idAlergia;
    this.nombre = nombre;
  }
}
