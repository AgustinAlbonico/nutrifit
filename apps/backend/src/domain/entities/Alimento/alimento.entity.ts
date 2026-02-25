import { GrupoAlimenticio } from './grupo-alimenticio.entity';
import { UnidadMedida } from './UnidadMedida';

export class Alimento {
  idAlimento: number | null;
  nombre: string;
  cantidad: number;
  unidadMedida: UnidadMedida;
  grupoAlimenticio: GrupoAlimenticio;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  hidratosDeCarbono: number | null;
  constructor(
    idAlimento: number | null = null,
    nombre: string,
    cantidad: number,
    unidadMedida: UnidadMedida,
    calorias: number | null = null,
    proteinas: number | null = null,
    carbohidratos: number | null = null,
    grasas: number | null = null,
    hidratosDeCarbono: number | null = null,
  ) {
    this.idAlimento = idAlimento;
    this.nombre = nombre;
    this.cantidad = cantidad;
    this.unidadMedida = unidadMedida;
    this.calorias = calorias;
    this.proteinas = proteinas;
    this.carbohidratos = carbohidratos;
    this.grasas = grasas;
    this.hidratosDeCarbono = hidratosDeCarbono;
  }
}
