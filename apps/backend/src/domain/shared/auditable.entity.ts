export abstract class AuditableEntity {
  fechaBaja: Date | null;

  constructor(fechaBaja: Date | null = null) {
    this.fechaBaja = fechaBaja;
  }
}
