import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';
import { GimnasioOrmEntity } from './gimnasio.entity';
import { NutricionistaOrmEntity } from './persona.entity';
import { PreparacionItemOrmEntity } from './preparacion-item.entity';

@Entity('preparacion')
export class PreparacionOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_preparacion' })
  idPreparacion: number;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre: string;

  @Column({ name: 'id_gimnasio', type: 'int' })
  gimnasioId: number;

  @Column({ name: 'creado_por_id', type: 'int' })
  creadoPorId: number;

  @ManyToOne(() => GimnasioOrmEntity, { nullable: false })
  @JoinColumn({ name: 'id_gimnasio' })
  gimnasio: GimnasioOrmEntity;

  @ManyToOne(() => NutricionistaOrmEntity, { nullable: false })
  @JoinColumn({ name: 'creado_por_id', referencedColumnName: 'idPersona' })
  creadoPor: NutricionistaOrmEntity;

  @OneToMany(() => PreparacionItemOrmEntity, (item) => item.preparacion, {
    cascade: true,
    eager: true,
  })
  items: PreparacionItemOrmEntity[];
}
