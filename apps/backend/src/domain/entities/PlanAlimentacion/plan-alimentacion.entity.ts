import { OpcionComidaEntity } from '../OpcionComida/opcion-comida.entity';
import { NutricionistaEntity } from '../Persona/Nutricionista/nutricionista.entity';

export class PlanAlimentacionEntity {
  idPlanAlimentacion: number | null;
  fechaCreacion: Date;
  objetivoNutricional: string;
  opcionesAlimentarias: OpcionComidaEntity[];
  nutricionista: NutricionistaEntity;
  constructor(
    idPlanAlimentacion: number | null = null,
    fechaCreacion: Date,
    objetivoNutricional: string,
    opcionesAlimentarias: OpcionComidaEntity[] = [],
    nutricionista: NutricionistaEntity,
  ) {
    this.idPlanAlimentacion = idPlanAlimentacion;
    this.fechaCreacion = fechaCreacion;
    this.objetivoNutricional = objetivoNutricional;
    this.opcionesAlimentarias = opcionesAlimentarias;
    this.nutricionista = nutricionista;
  }
}
