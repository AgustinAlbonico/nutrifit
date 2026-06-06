import { NutricionistaEntity } from '../Persona/Nutricionista/nutricionista.entity';

export class ExcepcionDisponibilidadEntity {
  idExcepcion: number | null;
  nutricionista: NutricionistaEntity;
  fechaInicio: Date;
  fechaFin: Date;
  motivo: string | null;

  constructor(
    nutricionista: NutricionistaEntity,
    fechaInicio: Date,
    fechaFin: Date,
    motivo: string | null = null,
    idExcepcion: number | null = null,
  ) {
    this.nutricionista = nutricionista;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.motivo = motivo;
    this.idExcepcion = idExcepcion;
  }
}
