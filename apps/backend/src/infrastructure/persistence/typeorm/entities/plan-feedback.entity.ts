import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VotoPlan } from 'src/domain/entities/PlanFeedback/plan-feedback.entity';
import {
  NutricionistaOrmEntity,
  PersonaOrmEntity,
} from './persona.entity';
import { PlanAlimentacionVersionOrmEntity } from './plan-alimentacion-version.entity';

/**
 * Tabla `plan_feedback` — voto (POSITIVO/NEGATIVO) + comentario opcional
 * que un nutricionista emite sobre una versión específica de un plan IA.
 *
 * Constraint UNIQUE en `id_plan_alimentacion_version` garantiza
 * 1 feedback por versión (ver `CrearFeedbackPlanUseCase`, Packet 3).
 *
 * CASCADE en FK a `plan_alimentacion_version`: si se borra una versión
 * (cosa que NO debería pasar en producción — son inmutables — pero sí
 * en limpieza de BD de test), el feedback se borra con ella.
 */
@Entity('plan_feedback')
@Index('uk_feedback_version', ['idPlanAlimentacionVersion'], { unique: true })
export class PlanFeedbackOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_plan_feedback', type: 'int' })
  idPlanFeedback: number;

  @Column({ name: 'id_plan_alimentacion_version', type: 'int' })
  idPlanAlimentacionVersion: number;

  @ManyToOne(
    () => PlanAlimentacionVersionOrmEntity,
    (version) => version.idPlanAlimentacionVersion,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'id_plan_alimentacion_version' })
  version: PlanAlimentacionVersionOrmEntity;

  @Column({ name: 'id_nutricionista', type: 'int' })
  idNutricionista: number;

  @ManyToOne(() => NutricionistaOrmEntity, { nullable: false })
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity | PersonaOrmEntity;

  @Column({ name: 'voto', type: 'enum', enum: ['POSITIVO', 'NEGATIVO'] })
  voto: VotoPlan;

  @Column({
    name: 'comentario',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  comentario: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}