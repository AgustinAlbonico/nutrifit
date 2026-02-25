import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { GrupoAlimenticioOrmEntity } from './grupo-alimenticio.entity';
import { GrupoAlimenticio } from 'src/domain/entities/Alimento/grupo-alimenticio.entity';

@Entity('alimento')
export class AlimentoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_alimento' })
  idAlimento: number;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre: string;

  @Column({ name: 'cantidad', type: 'int' })
  cantidad: number;

  @Column({ name: 'calorias', type: 'int', nullable: true })
  calorias: number | null;

  @Column({ name: 'proteinas', type: 'int', nullable: true })
  proteinas: number | null;

  @Column({ name: 'carbohidratos', type: 'int', nullable: true })
  carbohidratos: number | null;

  @Column({ name: 'grasas', type: 'int', nullable: true })
  grasas: number | null;

  @Column({ name: 'hidratos_de_carbono', type: 'int', nullable: true })
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
  grupoAlimenticio: GrupoAlimenticio;
}
