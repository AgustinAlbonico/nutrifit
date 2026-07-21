import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { PreparacionOrmEntity } from './preparacion.entity';
import { AlimentoOrmEntity } from './alimento.entity';

const decimalTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
};

@Entity('preparacion_item')
export class PreparacionItemOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_preparacion_item' })
  idPreparacionItem: number;

  @Column({ name: 'id_preparacion', type: 'int' })
  preparacionId: number;

  @Column({ name: 'id_alimento', type: 'int' })
  alimentoId: number;

  @Column({
    name: 'cantidad_default',
    type: 'decimal',
    precision: 8,
    scale: 2,
    transformer: decimalTransformer,
  })
  cantidadDefault: number;

  @Column({ name: 'unidad_default', type: 'enum', enum: UnidadMedida })
  unidadDefault: UnidadMedida;

  @ManyToOne(() => PreparacionOrmEntity, (p) => p.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_preparacion' })
  preparacion: PreparacionOrmEntity;

  @ManyToOne(() => AlimentoOrmEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'id_alimento' })
  alimento: AlimentoOrmEntity;
}
