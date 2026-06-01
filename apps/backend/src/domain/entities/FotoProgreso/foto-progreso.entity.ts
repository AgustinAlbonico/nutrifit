import { AuditableEntity } from '../../shared/auditable.entity';

export type TipoFoto = 'FRENTE' | 'PERFIL' | 'ESPALDA';

export class FotoProgresoEntity extends AuditableEntity {
  idFoto: number | null;
  socioId: number;
  tipoFoto: TipoFoto;
  fecha: Date;
  objectKey: string;
  notas: string | null;
  createdAt: Date;

  constructor(
    idFoto: number | null = null,
    socioId: number,
    tipoFoto: TipoFoto,
    fecha: Date,
    objectKey: string,
    notas: string | null = null,
    createdAt: Date = new Date(),
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idFoto = idFoto;
    this.socioId = socioId;
    this.tipoFoto = tipoFoto;
    this.fecha = fecha;
    this.objectKey = objectKey;
    this.notas = notas;
    this.createdAt = createdAt;
  }
}
