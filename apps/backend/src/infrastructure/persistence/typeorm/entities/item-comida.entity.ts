import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { OpcionComidaOrmEntity } from './opcion-comida.entity';
import { AlimentoOrmEntity } from './alimento.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

const decimalTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
};

@Entity('item_comida')
export class ItemComidaOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_item_comida' })
  idItemComida: number;

  @Column({ name: 'id_opcion_comida', type: 'int' })
  opcionComidaId: number;

  @Column({ name: 'id_alimento', type: 'int' })
  alimentoId: number;

  @Column({ name: 'alimento_nombre', type: 'varchar', length: 255 })
  alimentoNombre: string;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad: number;

  @Column({ name: 'unidad_medida', type: 'enum', enum: UnidadMedida })
  unidad: UnidadMedida;

  @Column({ name: 'notas', type: 'varchar', length: 255, nullable: true })
  notas: string | null;

  @Column({ name: 'calorias', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  calorias: number | null;

  @Column({ name: 'proteinas', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  proteinas: number | null;

  @Column({ name: 'carbohidratos', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  carbohidratos: number | null;

  @Column({ name: 'grasas', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  grasas: number | null;

  @ManyToOne(() => OpcionComidaOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_opcion_comida' })
  opcionComida: OpcionComidaOrmEntity;

  @ManyToOne(() => AlimentoOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_alimento' })
  alimento: AlimentoOrmEntity;
}
