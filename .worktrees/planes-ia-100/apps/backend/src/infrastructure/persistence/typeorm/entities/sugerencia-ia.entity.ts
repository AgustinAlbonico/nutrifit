import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SugerenciaEstado } from 'src/domain/entities/SugerenciaIA/sugerencia-ia.entity';
import { PropuestaIA } from '@nutrifit/shared';

@Entity('sugerencia_ia')
export class SugerenciaIAOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_sugerencia' })
  idSugerencia: number;

  @Column({ name: 'id_socio', type: 'int' })
  socioId: number;

  @Column({ name: 'objetivo', type: 'varchar', length: 500 })
  objetivo: string;

  @Column({ name: 'restricciones', type: 'json', nullable: true })
  restricciones: string[] | null;

  @Column({ name: 'info_extra', type: 'text' })
  infoExtra: string;

  @Column({ name: 'propuesta', type: 'jsonb', nullable: true })
  propuesta: PropuestaIA | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: SugerenciaEstado,
  })
  estado: SugerenciaEstado;

  @CreateDateColumn({ name: 'creada_en' })
  creadaEn: Date;

  @Column({ name: 'usada_en', type: 'timestamp', nullable: true })
  usadaEn: Date | null;
}
