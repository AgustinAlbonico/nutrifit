import { Alimento } from '../Alimento/alimento.entity';
import { TipoComida } from './TipoComida';
import { AuditableEntity } from '../../shared/auditable.entity';

export class OpcionComidaEntity extends AuditableEntity {
  idOpcionComida: number | null;
  tipoComida: TipoComida;
  descripcion: string | null;
  alimentos: Alimento[];
  constructor(
    idOpcionComida: number | null = null,
    tipoComida: TipoComida,
    descripcion: string | null = null,
    alimentos: Alimento[] = [],
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idOpcionComida = idOpcionComida;
    this.tipoComida = tipoComida;
    this.descripcion = descripcion;
    this.alimentos = alimentos;
  }
}
