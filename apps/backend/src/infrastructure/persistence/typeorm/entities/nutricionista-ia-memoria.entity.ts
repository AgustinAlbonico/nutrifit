import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoEjemploIA } from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';
import {
  NutricionistaOrmEntity,
  PersonaOrmEntity,
} from './persona.entity';
import { PlanAlimentacionVersionOrmEntity } from './plan-alimentacion-version.entity';

/**
 * Tabla `nutricionista_ia_memoria` — entradas de memoria de feedback del
 * nutricionista para la IA.
 *
 * Cada feedback con comentario no vacío produce una entrada aquí (POSITIVO
 * o NEGATIVO según el voto). La selección adaptativa 1-3 ejemplos para
 * inyectar al prompt vive en `SeleccionarEjemplosMemoriaUseCase` (Packet 3).
 *
 * Índice compuesto `(id_nutricionista, tipo_ejemplo, archivada)` optimiza
 * la query de selección: filtra por NUT, separa positivos/negativos,
 * excluye archivadas.
 *
 * FK a versión con `ON DELETE SET NULL`: si la versión se borra (caso de
 * test), la memoria queda huérfana pero NO se pierde el aprendizaje.
 */
@Entity('nutricionista_ia_memoria')
@Index('idx_memoria_seleccion', [
  'idNutricionista',
  'tipoEjemplo',
  'archivada',
])
export class NutricionistaIAMemoriaOrmEntity {
  @PrimaryGeneratedColumn({
    name: 'id_nutricionista_ia_memoria',
    type: 'int',
  })
  idNutricionistaIaMemoria: number;

  @Column({ name: 'id_nutricionista', type: 'int' })
  idNutricionista: number;

  @ManyToOne(() => NutricionistaOrmEntity, { nullable: false })
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity | PersonaOrmEntity;

  @Column({
    name: 'tipo_ejemplo',
    type: 'enum',
    enum: ['POSITIVO', 'NEGATIVO'],
  })
  tipoEjemplo: TipoEjemploIA;

  @Column({ name: 'comentario', type: 'varchar', length: 500 })
  comentario: string;

  @Column({
    name: 'id_plan_alimentacion_version',
    type: 'int',
    nullable: true,
  })
  idPlanAlimentacionVersion: number | null;

  @ManyToOne(
    () => PlanAlimentacionVersionOrmEntity,
    (version) => version.idPlanAlimentacionVersion,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'id_plan_alimentacion_version' })
  version: PlanAlimentacionVersionOrmEntity | null;

  @Column({ name: 'archivada', type: 'boolean', default: false })
  archivada: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}