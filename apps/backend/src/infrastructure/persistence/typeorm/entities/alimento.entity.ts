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

  @Column({ name: 'colesterol', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  colesterol: number | null;

  @Column({ name: 'fibra_alimentaria', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  fibraAlimentaria: number | null;

  @Column({ name: 'sodio', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  sodio: number | null;

  @Column({ name: 'agua', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  agua: number | null;

  @Column({ name: 'vitamina_a', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  vitaminaA: number | null;

  @Column({ name: 'vitamina_b6', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  vitaminaB6: number | null;

  @Column({ name: 'vitamina_b12', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  vitaminaB12: number | null;

  @Column({ name: 'vitamina_c', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  vitaminaC: number | null;

  @Column({ name: 'vitamina_d', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  vitaminaD: number | null;

  @Column({ name: 'vitamina_e', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  vitaminaE: number | null;

  @Column({ name: 'vitamina_k', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  vitaminaK: number | null;

  @Column({ name: 'almidon', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  almidon: number | null;

  @Column({ name: 'lactosa', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  lactosa: number | null;

  @Column({ name: 'alcohol', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  alcohol: number | null;

  @Column({ name: 'cafeina', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  cafeina: number | null;

  @Column({ name: 'azucares', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  azucares: number | null;

  @Column({ name: 'calcio', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  calcio: number | null;

  @Column({ name: 'hierro', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  hierro: number | null;

  @Column({ name: 'magnesio', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  magnesio: number | null;

  @Column({ name: 'fosforo', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  fosforo: number | null;

  @Column({ name: 'potasio', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  potasio: number | null;

  @Column({ name: 'cinc', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  cinc: number | null;

  @Column({ name: 'cobre', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  cobre: number | null;

  @Column({ name: 'fluor', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  fluor: number | null;

  @Column({ name: 'manganeso', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  manganeso: number | null;

  @Column({ name: 'selenio', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  selenio: number | null;

  @Column({ name: 'tiamina', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  tiamina: number | null;

  @Column({ name: 'riboflavina', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  riboflavina: number | null;

  @Column({ name: 'niacina', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  niacina: number | null;

  @Column({ name: 'acido_pantotenico', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  acidoPantotenico: number | null;

  @Column({ name: 'folato', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  folato: number | null;

  @Column({ name: 'acido_folico', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  acidoFolico: number | null;

  @Column({ name: 'grasas_trans', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  grasasTrans: number | null;

  @Column({ name: 'grasas_saturadas', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  grasasSaturadas: number | null;

  @Column({ name: 'grasas_monoinsaturadas', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  grasasMonoinsaturadas: number | null;

  @Column({ name: 'grasas_poliinsaturadas', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  grasasPoliinsaturadas: number | null;

  @Column({ name: 'cloruro', type: 'decimal', precision: 8, scale: 2, nullable: true, transformer: decimalTransformer })
  cloruro: number | null;

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
