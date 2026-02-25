import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutricionistaOrmEntity, SocioOrmEntity } from './persona.entity';
import { DiaPlanOrmEntity } from './dia-plan.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { OpcionComidaOrmEntity } from './opcion-comida.entity';
import { OpcionComidaEntity } from 'src/domain/entities/OpcionComida/opcion-comida.entity';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';

@Entity('plan_alimentacion')
export class PlanAlimentacionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_plan_alimentacion' })
  idPlanAlimentacion: number;

  @Column({ name: 'fechaCreacion', type: 'date' })
  fechaCreacion: Date;

  @Column({ name: 'objetivo_nutricional', type: 'varchar', length: 255 })
  objetivoNutricional: string;

  @ManyToOne(() => SocioOrmEntity, (socio) => socio.planesAlimentacion, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_socio' })
  socio: SocioEntity;

  @ManyToOne(
    () => NutricionistaOrmEntity,
    (nutricionista) => nutricionista.planesAlimentacion,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaEntity;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'eliminado_en', type: 'datetime', nullable: true })
  eliminadoEn: Date | null;

  @Column({
    name: 'motivo_eliminacion',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  motivoEliminacion: string | null;

  @Column({
    name: 'motivo_edicion',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  motivoEdicion: string | null;

  @Column({ name: 'ultima_edicion', type: 'datetime', nullable: true })
  ultimaEdicion: Date | null;

  @OneToMany(() => DiaPlanOrmEntity, (diaPlan) => diaPlan.planAlimentacion, {
    eager: true,
    nullable: false,
  })
  dias: DiaPlanOrmEntity[];
}
