import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutricionistaOrmEntity } from './persona.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('diploma')
export class DiplomaOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_diploma' })
  idDiploma: number;

  @Column({ name: 'id_nutricionista', type: 'int' })
  idNutricionista: number;

  @Column({ name: 'document_key', type: 'varchar', length: 255 })
  documentKey: string;

  @Column({
    name: 'nombre_original',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nombreOriginal: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @ManyToOne(
    () => NutricionistaOrmEntity,
    (nutricionista) => nutricionista.diplomas,
    { nullable: false },
  )
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity;
}
