import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TurnoOrmEntity } from './turno.entity';
import { TurnoEntity } from 'src/domain/entities/Turno/turno.entity';

@Entity('observacion_clinica')
export class ObservacionClinicaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_observacion' })
  idObservacion: number;

  @Column({ name: 'comentario', type: 'varchar', length: 255 })
  comentario: string;

  @Column({ name: 'peso', type: 'decimal', precision: 5, scale: 2 })
  peso: number;

  @Column({ name: 'altura', type: 'int' })
  altura: number;

  @Column({ name: 'imc', type: 'decimal', precision: 5, scale: 2 })
  imc: number;

  @Column({ name: '', type: 'date' })
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

  @OneToOne(() => TurnoOrmEntity, (turno) => turno.observacionClinica, {
    nullable: false,
  })
  turno: TurnoEntity;
}
