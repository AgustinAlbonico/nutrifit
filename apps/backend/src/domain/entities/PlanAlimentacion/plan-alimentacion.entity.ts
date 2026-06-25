import { OpcionComidaEntity } from '../OpcionComida/opcion-comida.entity';
import { NutricionistaEntity } from '../Persona/Nutricionista/nutricionista.entity';
import { AuditableEntity } from '../../shared/auditable.entity';

export class PlanAlimentacionEntity extends AuditableEntity {
  idPlanAlimentacion: number | null;
  fechaCreacion: Date;
  objetivoNutricional: string;
  opcionesAlimentarias: OpcionComidaEntity[];
  nutricionista: NutricionistaEntity;
  /**
   * Notas puntuales del nutricionista para esta generación específica del
   * plan (max 1000 chars). Se concatenan con `nutricionista.preferenciasIa`
   * al construir el prompt de IA. Distinto de las preferencias persistentes
   * porque viven en el plan, no en el perfil del profesional.
   */
  notasGeneracion: string | null;

  constructor(
    idPlanAlimentacion: number | null = null,
    fechaCreacion: Date,
    objetivoNutricional: string,
    opcionesAlimentarias: OpcionComidaEntity[] = [],
    nutricionista: NutricionistaEntity,
    fechaBaja: Date | null = null,
    notasGeneracion: string | null = null,
  ) {
    super(fechaBaja);
    this.idPlanAlimentacion = idPlanAlimentacion;
    this.fechaCreacion = fechaCreacion;
    this.objetivoNutricional = objetivoNutricional;
    this.opcionesAlimentarias = opcionesAlimentarias;
    this.nutricionista = nutricionista;
    this.notasGeneracion = notasGeneracion;
  }
}
