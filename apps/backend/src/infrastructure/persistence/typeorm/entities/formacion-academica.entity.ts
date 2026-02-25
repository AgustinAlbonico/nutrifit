import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutricionistaOrmEntity } from './persona.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';

@Entity('formacion_academica')
export class FormacionAcademicaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_formacion_academica' })
  idFormacionAcademica: number;

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  titulo: string;

  @Column({ name: 'institucion', type: 'varchar', length: 255 })
  institucion: string;

  @Column({ name: 'anio_inicio', type: 'int' })
  añoInicio: number;

  @Column({ name: 'anio_fin', type: 'int' })
  añoFin: number;

  @Column({ name: 'nivel', type: 'varchar', length: 50 })
  nivel: string;

  @ManyToOne(
    () => NutricionistaOrmEntity,
    (nutricionista) => nutricionista.formacionAcademica,
    { nullable: false },
  )
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaEntity;
}
