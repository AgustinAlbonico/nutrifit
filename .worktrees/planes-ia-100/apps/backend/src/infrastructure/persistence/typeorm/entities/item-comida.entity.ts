import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { OpcionComidaOrmEntity } from './opcion-comida.entity';
import { AlimentoOrmEntity } from './alimento.entity';

@Entity('item_comida')
export class ItemComidaOrmEntity {
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

  @Column({ name: 'calorias', type: 'int', nullable: true })
  calorias: number | null;

  @Column({ name: 'proteinas', type: 'int', nullable: true })
  proteinas: number | null;

  @Column({ name: 'carbohidratos', type: 'int', nullable: true })
  carbohidratos: number | null;

  @Column({ name: 'grasas', type: 'int', nullable: true })
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
