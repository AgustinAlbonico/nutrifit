import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  VersionColumn,
} from 'typeorm';
import { TurnoOrmEntity } from './turno.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('observacion_clinica')
export class ObservacionClinicaOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_observacion' })
  idObservacion: number;

  @VersionColumn({ name: 'version' })
  version: number;

  @Column({ name: 'comentario', type: 'varchar', length: 255 })
  comentario: string;

  @Column({ name: 'peso', type: 'decimal', precision: 5, scale: 2 })
  peso: number;

  @Column({ name: 'altura', type: 'int' })
  altura: number;

  @Column({ name: 'imc', type: 'decimal', precision: 5, scale: 2 })
  imc: number;

  @Column({ name: 'sugerencias', type: 'varchar', length: 255, nullable: true })
  sugerencias: string | null;

  @Column({
    name: 'habitos_socio',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  habitosSocio: string | null;

  @Column({
    name: 'objetivos_socio',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  objetivosSocio: string | null;

  @Column({
    name: 'es_publica',
    type: 'boolean',
    default: false,
  })
  esPublica: boolean;

  @OneToOne(() => TurnoOrmEntity, (turno) => turno.observacionClinica, {
    nullable: false,
  })
  turno: TurnoOrmEntity;
}
