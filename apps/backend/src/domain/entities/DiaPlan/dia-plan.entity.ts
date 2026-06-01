import { OpcionComidaEntity } from '../OpcionComida/opcion-comida.entity';
import { DiaSemana } from './DiaSemana';
import { AuditableEntity } from '../../shared/auditable.entity';

export class DiaPlanEntity extends AuditableEntity {
  idDiaPlan: number | null;
  dia: DiaSemana;
  orden: number; // Para ordenar los días en el plan
  opcionesComida: OpcionComidaEntity[];

  constructor(
    idDiaPlan: number | null = null,
    dia: DiaSemana,
    orden: number,
    opcionesComida: OpcionComidaEntity[] = [],
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idDiaPlan = idDiaPlan;
    this.dia = dia;
    this.orden = orden;
    this.opcionesComida = opcionesComida;
  }
}
