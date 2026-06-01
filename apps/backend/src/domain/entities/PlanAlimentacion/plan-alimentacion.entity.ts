import { OpcionComidaEntity } from '../OpcionComida/opcion-comida.entity';
import { NutricionistaEntity } from '../Persona/Nutricionista/nutricionista.entity';
import { AuditableEntity } from '../../shared/auditable.entity';

export class PlanAlimentacionEntity extends AuditableEntity {
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
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idPlanAlimentacion = idPlanAlimentacion;
    this.fechaCreacion = fechaCreacion;
    this.objetivoNutricional = objetivoNutricional;
    this.opcionesAlimentarias = opcionesAlimentarias;
    this.nutricionista = nutricionista;
  }
}
