import { UnidadMedida } from '../Alimento/UnidadMedida';
import { AuditableEntity } from '../../shared/auditable.entity';

export interface ItemComidaEntityProps {
  idItemComida: number | null;
  opcionComidaId: number | null;
  alimentoId: number;
  alimentoNombre: string;
  cantidad: number;
  unidad: UnidadMedida;
  notas: string | null;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
}

export class ItemComidaEntity extends AuditableEntity {
  idItemComida: number | null;
  opcionComidaId: number | null;
  alimentoId: number;
  alimentoNombre: string;
  cantidad: number;
  unidad: UnidadMedida;
  notas: string | null;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;

  constructor(props: ItemComidaEntityProps, fechaBaja: Date | null = null) {
    super(fechaBaja);
    this.idItemComida = props.idItemComida;
    this.opcionComidaId = props.opcionComidaId;
    this.alimentoId = props.alimentoId;
    this.alimentoNombre = props.alimentoNombre;
    this.cantidad = props.cantidad;
    this.unidad = props.unidad;
    this.notas = props.notas;
    this.calorias = props.calorias;
    this.proteinas = props.proteinas;
    this.carbohidratos = props.carbohidratos;
    this.grasas = props.grasas;
  }
}
