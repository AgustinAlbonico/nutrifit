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
  /**
   * Estado explícito del plan (máquina de estados introducida en Packet 4
   * del change plan-alimentacion-ia-v2).
   *   - 'BORRADOR'  → recién creado, en proceso de edición.
   *   - 'ACTIVO'    → tiene una versión activa visible para el socio.
   *   - 'FINALIZADO'→ el nutricionista lo cerró.
   */
  estado: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';
  /**
   * Timestamp de la transición a estado FINALIZADO. NULL mientras el plan
   * no esté finalizado.
   */
  finalizadoAt: Date | null;

  constructor(
    idPlanAlimentacion: number | null = null,
    fechaCreacion: Date,
    objetivoNutricional: string,
    opcionesAlimentarias: OpcionComidaEntity[] = [],
    nutricionista: NutricionistaEntity,
    fechaBaja: Date | null = null,
    notasGeneracion: string | null = null,
    estado: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO' = 'ACTIVO',
    finalizadoAt: Date | null = null,
  ) {
    super(fechaBaja);
    this.idPlanAlimentacion = idPlanAlimentacion;
    this.fechaCreacion = fechaCreacion;
    this.objetivoNutricional = objetivoNutricional;
    this.opcionesAlimentarias = opcionesAlimentarias;
    this.nutricionista = nutricionista;
    this.notasGeneracion = notasGeneracion;
    this.estado = estado;
    this.finalizadoAt = finalizadoAt;
  }
}
