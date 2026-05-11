import { UnidadMedida } from '../Alimento/UnidadMedida';

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

export class ItemComidaEntity {
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

  constructor(props: ItemComidaEntityProps) {
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
