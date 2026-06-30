import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { GrupoAlimenticioOrmEntity } from './grupo-alimenticio.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

/**
 * MySQL devuelve columnas DECIMAL como string. Este transformer
 * garantiza que el dominio siempre reciba `number | null`.
 */
const decimalTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
};

@Entity('alimento')
export class AlimentoOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_alimento' })
  idAlimento: number;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre: string;

  @Column({ name: 'cantidad', type: 'decimal', precision: 8, scale: 2, transformer: decimalTransformer })
  cantidad: number;

  @Column({ name: 'calorias', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  calorias: number | null;

  @Column({ name: 'proteinas', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  proteinas: number | null;

  @Column({ name: 'carbohidratos', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  carbohidratos: number | null;

  @Column({ name: 'grasas', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  grasas: number | null;

  @Column({ name: 'hidratos_de_carbono', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  hidratosDeCarbono: number | null;

  @Column({ name: 'unidad_medida', type: 'enum', enum: UnidadMedida })
  unidadMedida: UnidadMedida;

  @ManyToMany(() => GrupoAlimenticioOrmEntity, { eager: true })
  @JoinTable({
    name: 'alimento_grupo_alimenticio',
    joinColumn: {
      name: 'id_alimento',
      referencedColumnName: 'idAlimento',
    },
    inverseJoinColumn: {
      name: 'id_grupo_alimenticio',
      referencedColumnName: 'idGrupoAlimenticio',
    },
  })
  grupoAlimenticio: GrupoAlimenticioOrmEntity[];
}
