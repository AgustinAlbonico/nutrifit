import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoNotificacion } from 'src/domain/entities/Notificacion/estado-notificacion.enum';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import type { NotificacionMetaData } from 'src/domain/entities/Notificacion/notificacion-metadata.interface';
import { UsuarioOrmEntity } from './usuario.entity';

@Entity('notificacion')
export class NotificacionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  idNotificacion: number;

  @Column({ name: 'destinatario_id', type: 'int' })
  destinatarioId: number;

  @ManyToOne(() => UsuarioOrmEntity, { nullable: false })
  @JoinColumn({ name: 'destinatario_id', referencedColumnName: 'idUsuario' })
  destinatario: UsuarioOrmEntity;

  @Column({ name: 'tipo', type: 'enum', enum: TipoNotificacion })
  tipo: TipoNotificacion;

  @Column({ name: 'titulo', type: 'varchar', length: 150 })
  titulo: string;

  @Column({ name: 'mensaje', type: 'varchar', length: 500 })
  mensaje: string;

  @Column({ name: 'estado', type: 'enum', enum: EstadoNotificacion })
  estado: EstadoNotificacion;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: NotificacionMetaData | null;

  @Column({ name: 'leida_en', type: 'datetime', nullable: true })
  leidaEn: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
