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

import type { EstadoGeneracionPlanIa } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';

import { PlanAlimentacionOrmEntity } from './plan-alimentacion.entity';
import { NutricionistaOrmEntity, SocioOrmEntity } from './persona.entity';

@Entity('generacion_plan_ia')
@Index('idx_generacion_plan_ia_activa', ['socioId', 'gimnasioId', 'estado'])
@Index('idx_generacion_plan_ia_plan', ['planAlimentacionId', 'estado'])
export class GeneracionPlanIaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_generacion_plan_ia', type: 'int' })
  idGeneracionPlanIa: number;

  @Column({ name: 'id_socio', type: 'int' })
  socioId: number;

  @ManyToOne(() => SocioOrmEntity, { nullable: false })
  @JoinColumn({ name: 'id_socio' })
  socio: SocioOrmEntity;

  @Column({ name: 'id_nutricionista', type: 'int' })
  nutricionistaId: number;

  @ManyToOne(() => NutricionistaOrmEntity, { nullable: false })
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity;

  @Column({ name: 'id_gimnasio', type: 'int' })
  gimnasioId: number;

  @Column({ name: 'id_plan_alimentacion', type: 'int', nullable: true })
  planAlimentacionId: number | null;

  @ManyToOne(() => PlanAlimentacionOrmEntity, { nullable: true })
  @JoinColumn({ name: 'id_plan_alimentacion' })
  planAlimentacion: PlanAlimentacionOrmEntity | null;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado: EstadoGeneracionPlanIa;

  @Column({ name: 'solicitud_json', type: 'json' })
  solicitudJson: unknown;

  @Column({ name: 'proveedor_actual', type: 'varchar', length: 50, nullable: true })
  proveedorActual: string | null;

  @Column({ name: 'mensaje_estado', type: 'varchar', length: 500, nullable: true })
  mensajeEstado: string | null;

  @Column({ name: 'error_mensaje', type: 'text', nullable: true })
  errorMensaje: string | null;

  @Column({ name: 'respuesta_json', type: 'json', nullable: true })
  respuestaJson: unknown | null;

  @Column({ name: 'progreso_actual', type: 'int', nullable: true })
  progresoActual: number | null;

  @Column({ name: 'progreso_total', type: 'int', nullable: true })
  progresoTotal: number | null;

  @Column({ name: 'dia_actual', type: 'varchar', length: 32, nullable: true })
  diaActual: string | null;

  @Column({ name: 'comida_actual', type: 'varchar', length: 64, nullable: true })
  comidaActual: string | null;

  @Column({ name: 'snapshot_parcial_json', type: 'json', nullable: true })
  snapshotParcialJson: unknown | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  actualizadoEn: Date;

  @Column({ name: 'iniciado_en', type: 'datetime', nullable: true })
  iniciadoEn: Date | null;

  @Column({ name: 'finalizado_en', type: 'datetime', nullable: true })
  finalizadoEn: Date | null;
}
