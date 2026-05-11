import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TurnoOrmEntity } from './turno.entity';

@Entity('turno_confirmacion_token')
export class TurnoConfirmacionTokenOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_turno_confirmacion_token' })
  idTurnoConfirmacionToken: number;

  @Column({ name: 'turno_id', type: 'int' })
  turnoId: number;

  @ManyToOne(() => TurnoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'turno_id', referencedColumnName: 'idTurno' })
  turno: TurnoOrmEntity;

  @Column({ name: 'token_hash', type: 'varchar', length: 255, unique: true })
  tokenHash: string;

  @Column({ name: 'expira_en', type: 'datetime' })
  expiraEn: Date;

  @Column({ name: 'usado_en', type: 'datetime', nullable: true })
  usadoEn: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
