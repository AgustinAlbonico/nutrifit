import { OpcionComidaEntity } from '../OpcionComida/opcion-comida.entity';
import { DiaSemana } from './DiaSemana';

export class DiaPlanEntity {
  idDiaPlan: number | null;
  dia: DiaSemana;
  orden: number; // Para ordenar los días en el plan
  opcionesComida: OpcionComidaEntity[];

  constructor(
    idDiaPlan: number | null = null,
    dia: DiaSemana,
    orden: number,
    opcionesComida: OpcionComidaEntity[] = [],
  ) {
    this.idDiaPlan = idDiaPlan;
    this.dia = dia;
    this.orden = orden;
    this.opcionesComida = opcionesComida;
  }
}
