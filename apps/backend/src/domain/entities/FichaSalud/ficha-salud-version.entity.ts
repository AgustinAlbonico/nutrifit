/**
 * Entidad de dominio inmutable que representa una versión histórica de la
 * ficha de salud de un socio. Por cada PUT /turnos/socio/ficha-salud se
 * inserta una nueva fila en la tabla `ficha_salud_version`.
 *
 * **REGLA DE INMUTABILIDAD**: esta entidad no expone setters ni métodos de
 * mutación. Una vez creada, una versión no puede modificarse ni borrarse
 * desde código de aplicación. El repository asociado NO expone `update` ni
 * `delete` (ver Task 1.16). El down de la migración es la única vía
 * legítima para eliminar versiones (rollback).
 *
 * RBs: RB50 (historial), RB29 (last-write-wins via UNIQUE constraint), RB42
 * (ficha editable — esta entidad preserva el historial).
 */
export class FichaSaludVersionEntity {
  idFichaSaludVersion: number | null;
  idFichaSalud: number;
  idSocio: number;
  version: number;
  datosJson: Record<string, unknown>;
  createdAt: Date;
  createdBy: number | null;

  constructor(
    idFichaSaludVersion: number | null,
    idFichaSalud: number,
    idSocio: number,
    version: number,
    datosJson: Record<string, unknown>,
    createdAt: Date = new Date(),
    createdBy: number | null = null,
  ) {
    this.idFichaSaludVersion = idFichaSaludVersion;
    this.idFichaSalud = idFichaSalud;
    this.idSocio = idSocio;
    this.version = version;
    this.datosJson = Object.freeze({ ...datosJson });
    this.createdAt = createdAt;
    this.createdBy = createdBy;
  }
}
