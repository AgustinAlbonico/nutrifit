import {
  EstadoObjetivo,
  TipoMetrica,
} from 'src/domain/entities/Objetivo/objetivo.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SocioOrmEntity } from './persona.entity';

@Entity('objetivo')
export class ObjetivoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_objetivo' })
  idObjetivo: number;

  @Column({ name: 'id_socio', type: 'int' })
  socioId: number;

  @Column({
    name: 'tipo_metrica',
    type: 'enum',
    enum: ['PESO', 'CINTURA', 'CADERA', 'BRAZO', 'MUSLO', 'PECHO'],
  })
  tipoMetrica: TipoMetrica;

  @Column({ name: 'valor_inicial', type: 'decimal', precision: 10, scale: 2 })
  valorInicial: number;

  @Column({ name: 'valor_objetivo', type: 'decimal', precision: 10, scale: 2 })
  valorObjetivo: number;

  @Column({ name: 'valor_actual', type: 'decimal', precision: 10, scale: 2 })
  valorActual: number;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['ACTIVO', 'COMPLETADO', 'ABANDONADO'],
  })
  estado: EstadoObjetivo;

  @Column({ name: 'fecha_inicio', type: 'datetime' })
  fechaInicio: Date;

  @Column({ name: 'fecha_objetivo', type: 'datetime', nullable: true })
  fechaObjetivo: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SocioOrmEntity, { nullable: false })
  @JoinColumn({ name: 'id_socio' })
  socio: SocioOrmEntity;
}
