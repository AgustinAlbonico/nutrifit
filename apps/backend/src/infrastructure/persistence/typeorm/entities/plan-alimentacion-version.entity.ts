import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import {
  PlanAlimentacionDatosJson,
  MotivoCambio,
} from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';
import { NutricionistaOrmEntity, PersonaOrmEntity } from './persona.entity';
import { PlanAlimentacionOrmEntity } from './plan-alimentacion.entity';

/**
 * Tabla `plan_alimentacion_version` — snapshot inmutable de un plan de
 * alimentación generado o editado.
 *
 * Regla de inmutabilidad: NO se exponen `update` ni `delete` desde el
 * repositorio. Para "modificar" un plan se crea una nueva fila con
 * `numeroVersion+1`. `plan_alimentacion_version.activa` funciona como
 * puntero al estado actual del plan (solo 1 activa por plan).
 *
 * Esta tabla es el corazón de la auditoría clínica: cada fila es una
 * versión fechada y firmada por `created_by`.
 */
@Entity('plan_alimentacion_version')
@Unique('uk_plan_version_numero', ['idPlanAlimentacion', 'numeroVersion'])
@Index('idx_plan_version_activa', ['idPlanAlimentacion', 'activa'])
export class PlanAlimentacionVersionOrmEntity {
  @PrimaryGeneratedColumn({
    name: 'id_plan_alimentacion_version',
    type: 'int',
  })
  idPlanAlimentacionVersion: number;

  @Column({ name: 'id_plan_alimentacion', type: 'int' })
  idPlanAlimentacion: number;

  @ManyToOne(
    () => PlanAlimentacionOrmEntity,
    (plan) => plan.idPlanAlimentacion,
    { nullable: false },
  )
  @JoinColumn({ name: 'id_plan_alimentacion' })
  planAlimentacion: PlanAlimentacionOrmEntity;

  @Column({ name: 'numero_version', type: 'int' })
  numeroVersion: number;

  @Column({ name: 'datos_json', type: 'json' })
  datosJson: PlanAlimentacionDatosJson;

  @Column({
    name: 'motivo_cambio',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  motivoCambio: MotivoCambio | null;

  @Column({ name: 'activa', type: 'boolean', default: false })
  activa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @ManyToOne(() => PersonaOrmEntity, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  creador: NutricionistaOrmEntity | PersonaOrmEntity;
}
