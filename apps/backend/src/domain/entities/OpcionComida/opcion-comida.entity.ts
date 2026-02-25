import { Alimento } from '../Alimento/alimento.entity';
import { TipoComida } from './TipoComida';

export class OpcionComidaEntity {
  idOpcionComida: number | null;
  tipoComida: TipoComida;
  descripcion: string | null;
  alimentos: Alimento[];
  constructor(
    idOpcionComida: number | null = null,
    tipoComida: TipoComida,
    descripcion: string | null = null,
    alimentos: Alimento[] = [],
  ) {
    this.idOpcionComida = idOpcionComida;
    this.tipoComida = tipoComida;
    this.descripcion = descripcion;
    this.alimentos = alimentos;
  }
}
