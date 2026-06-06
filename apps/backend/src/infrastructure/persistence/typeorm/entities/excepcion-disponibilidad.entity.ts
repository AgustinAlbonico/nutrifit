import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutricionistaOrmEntity } from './persona.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('excepcion_disponibilidad')
export class ExcepcionDisponibilidadOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_excepcion' })
  idExcepcion: number;

  @Column({ name: 'fecha_inicio', type: 'datetime' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'datetime' })
  fechaFin: Date;

  @Column({ name: 'motivo', type: 'varchar', length: 255, nullable: true })
  motivo: string | null;

  @ManyToOne(() => NutricionistaOrmEntity, { nullable: false })
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity;
}
