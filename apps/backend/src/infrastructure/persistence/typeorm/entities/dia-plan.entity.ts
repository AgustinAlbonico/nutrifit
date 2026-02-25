import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { PlanAlimentacionOrmEntity } from './plan-alimentacion.entity';
import { OpcionComidaOrmEntity } from './opcion-comida.entity';

@Entity('dia_plan')
export class DiaPlanOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_dia_plan' })
  idDiaPlan: number;

  @Column({ name: 'dia', type: 'enum', enum: DiaSemana })
  dia: DiaSemana;

  @Column({ name: 'orden', type: 'int' })
  orden: number;

  @ManyToOne(() => PlanAlimentacionOrmEntity, (plan) => plan.dias, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_plan_alimentacion' })
  planAlimentacion: PlanAlimentacionOrmEntity;

  @OneToMany(() => OpcionComidaOrmEntity, (opcion) => opcion.diaPlan, {
    eager: true,
    nullable: true,
  })
  opcionesComida: OpcionComidaOrmEntity[];
}
