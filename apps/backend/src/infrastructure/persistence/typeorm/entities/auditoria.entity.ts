import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsuarioOrmEntity } from './usuario.entity';

export enum AccionAuditoria {
  LOGIN_EXITO = 'LOGIN_EXITO',
  LOGIN_FALLO = 'LOGIN_FALLO',
  FICHA_ACCESO = 'FICHA_ACCESO',
  PLAN_CREADO = 'PLAN_CREADO',
  PLAN_EDITADO = 'PLAN_EDITADO',
  PLAN_DELETED = 'PLAN_DELETED',
  CONSULTA_INICIADA = 'CONSULTA_INICIADA',
  CONSULTA_FINALIZADA = 'CONSULTA_FINALIZADA',
  ADJUNTO_SUBIDO = 'ADJUNTO_SUBIDO',
  ADJUNTO_ELIMINADO = 'ADJUNTO_ELIMINADO',
  TURNO_ESTADO_CAMBIO = 'TURNO_ESTADO_CAMBIO',
}

@Entity('auditoria')
@Index('idx_auditoria_timestamp', ['timestamp'])
@Index('idx_auditoria_usuario', ['usuario'])
@Index('idx_auditoria_accion', ['accion'])
export class AuditoriaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_auditoria' })
  idAuditoria: number;

  @ManyToOne(() => UsuarioOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: UsuarioOrmEntity;

  @Column({
    name: 'id_usuario',
    type: 'int',
    nullable: true,
  })
  usuarioId: number | null;

  @Column({
    name: 'accion',
    type: 'varchar',
    length: 100,
  })
  accion: AccionAuditoria;

  @Column({
    name: 'entidad',
    type: 'varchar',
    length: 100,
  })
  entidad: string;

  @Column({
    name: 'entidad_id',
    type: 'int',
    nullable: true,
  })
  entidadId: number | null;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({
    name: 'ip_origen',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ipOrigen: string | null;

  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent: string | null;

  @Column({
    name: 'metadata',
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, unknown> | null;
}
