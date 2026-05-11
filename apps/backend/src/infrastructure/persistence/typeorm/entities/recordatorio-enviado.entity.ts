import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TipoRecordatorio {
  REMINDER_24H = 'REMINDER_24H',
  REMINDER_48H = 'REMINDER_48H',
}

@Entity('recordatorio_enviado')
@Index('uq_recordatorio_turno_tipo', ['turnoId', 'tipoRecordatorio'], {
  unique: true,
})
export class RecordatorioEnviadoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_recordatorio_enviado' })
  idRecordatorioEnviado: number;

  @Column({ name: 'turno_id', type: 'int' })
  turnoId: number;

  @Column({ name: 'tipo_recordatorio', type: 'enum', enum: TipoRecordatorio })
  tipoRecordatorio: TipoRecordatorio;

  @CreateDateColumn({ name: 'enviado_en', type: 'datetime' })
  enviadoEn: Date;
}
