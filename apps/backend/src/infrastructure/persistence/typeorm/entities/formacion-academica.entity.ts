import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutricionistaOrmEntity } from './persona.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';
import { NivelFormacion } from 'src/domain/entities/Certificacion/nivel-formacion';

@Entity('formacion_academica')
export class FormacionAcademicaOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_formacion_academica' })
  idFormacionAcademica: number;

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  titulo: string;

  @Column({ name: 'institucion', type: 'varchar', length: 255 })
  institucion: string;

  @Column({ name: 'anio_inicio', type: 'int' })
  añoInicio: number;

  @Column({ name: 'anio_fin', type: 'int', nullable: true })
  añoFin: number | null;

  @Column({ name: 'nivel', type: 'enum', enum: NivelFormacion })
  nivel: NivelFormacion;

  @ManyToOne(
    () => NutricionistaOrmEntity,
    (nutricionista) => nutricionista.formacionAcademica,
    { nullable: false },
  )
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity;
}
