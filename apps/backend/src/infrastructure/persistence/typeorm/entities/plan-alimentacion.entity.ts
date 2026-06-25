import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutricionistaOrmEntity, SocioOrmEntity } from './persona.entity';
import { DiaPlanOrmEntity } from './dia-plan.entity';
import { OpcionComidaOrmEntity } from './opcion-comida.entity';

@Entity('plan_alimentacion')
export class PlanAlimentacionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_plan_alimentacion' })
  idPlanAlimentacion: number;

  @Column({ name: 'fechaCreacion', type: 'date' })
  fechaCreacion: Date;

  @Column({ name: 'objetivo_nutricional', type: 'varchar', length: 255 })
  objetivoNutricional: string;

  @ManyToOne(() => SocioOrmEntity, (socio) => socio.planesAlimentacion, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_socio' })
  socio: SocioOrmEntity;

  @ManyToOne(
    () => NutricionistaOrmEntity,
    (nutricionista) => nutricionista.planesAlimentacion,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity;

  @Column({ name: 'activo', type: 'boolean', default: false })
  activo: boolean;

  /**
   * Estado explícito del plan (máquina de estados introducida en Packet 4
   * del change plan-alimentacion-ia-v2). Valores posibles:
   *   - 'BORRADOR'  → recién creado, en proceso de edición (default).
   *   - 'ACTIVO'    → tiene una versión activa visible para el socio.
   *   - 'FINALIZADO'→ el nutricionista lo cerró; no se pueden crear más versiones.
   *
   * Hotfix Packet 8: el default pasó de 'ACTIVO' (compatible legacy) a
   * 'BORRADOR'. La primera generación de un plan nuevo debe quedar en
   * BORRADOR hasta que el nutricionista lo active explícitamente vía
   * `ActivarPlanAlimentacionUseCase`. La migración
   * `PlanV2EstadoDefaultFix` actualiza los defaults sin tocar filas
   * existentes (preserva backward compat para planes legacy con
   * activo=true/estado='ACTIVO').
   */
  @Column({
    name: 'estado',
    type: 'varchar',
    length: 20,
    default: 'BORRADOR',
  })
  estado: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';

  /**
   * Timestamp de la transición a estado FINALIZADO. NULL mientras el plan
   * no esté finalizado. Se setea en `FinalizarPlanAlimentacionUseCase`.
   */
  @Column({
    name: 'finalizado_at',
    type: 'datetime',
    nullable: true,
  })
  finalizadoAt: Date | null;

  @Column({ name: 'eliminado_en', type: 'datetime', nullable: true })
  eliminadoEn: Date | null;

  @Column({
    name: 'motivo_eliminacion',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  motivoEliminacion: string | null;

  @Column({
    name: 'motivo_edicion',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  motivoEdicion: string | null;

  @Column({ name: 'ultima_edicion', type: 'datetime', nullable: true })
  ultimaEdicion: Date | null;

  /**
   * Notas puntuales del nutricionista para esta generación específica del plan.
   * Se concatenan con `nutricionista_orm.preferencias_ia` al construir el
   * prompt de IA. Max 1000 chars.
   */
  @Column({
    name: 'notas_generacion',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  notasGeneracion: string | null;

  @OneToMany(() => DiaPlanOrmEntity, (diaPlan) => diaPlan.planAlimentacion, {
    eager: true,
    nullable: false,
  })
  dias: DiaPlanOrmEntity[];
}
