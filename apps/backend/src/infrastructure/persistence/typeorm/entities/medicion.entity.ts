import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TurnoOrmEntity } from './turno.entity';

@Entity('medicion')
export class MedicionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_medicion' })
  idMedicion: number;

  // Obligatorios
  @Column({ name: 'peso', type: 'decimal', precision: 5, scale: 2 })
  peso: number;

  @Column({ name: 'altura', type: 'int' })
  altura: number;

  @Column({ name: 'imc', type: 'decimal', precision: 5, scale: 2 })
  imc: number;

  // Perímetros (opcionales)
  @Column({
    name: 'perimetro_cintura',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  perimetroCintura: number | null;

  @Column({
    name: 'perimetro_cadera',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  perimetroCadera: number | null;

  @Column({
    name: 'perimetro_brazo',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  perimetroBrazo: number | null;

  @Column({
    name: 'perimetro_muslo',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  perimetroMuslo: number | null;

  @Column({
    name: 'perimetro_pecho',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  perimetroPecho: number | null;

  // Pliegues cutáneos (opcionales)
  @Column({
    name: 'pliegue_triceps',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  pliegueTriceps: number | null;

  @Column({
    name: 'pliegue_abdominal',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  pliegueAbdominal: number | null;

  @Column({
    name: 'pliegue_muslo',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  pliegueMuslo: number | null;

  // Composición corporal (opcionales)
  @Column({
    name: 'porcentaje_grasa',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  porcentajeGrasa: number | null;

  @Column({
    name: 'masa_magra',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  masaMagra: number | null;

  // Signos vitales (opcionales)
  @Column({
    name: 'frecuencia_cardiaca',
    type: 'int',
    nullable: true,
  })
  frecuenciaCardiaca: number | null;

  @Column({
    name: 'tension_sistolica',
    type: 'int',
    nullable: true,
  })
  tensionSistolica: number | null;

  @Column({
    name: 'tension_diastolica',
    type: 'int',
    nullable: true,
  })
  tensionDiastolica: number | null;

  // Notas
  @Column({
    name: 'notas_medicion',
    type: 'text',
    nullable: true,
  })
  notasMedicion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => TurnoOrmEntity, (turno) => turno.mediciones, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_turno' })
  turno: TurnoOrmEntity;
}
