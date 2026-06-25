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
import { GimnasioOrmEntity } from './gimnasio.entity';

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
  FICHA_COMPLETADA = 'FICHA_COMPLETADA',
  FICHA_ACTUALIZADA = 'FICHA_ACTUALIZADA',
  MANUAL_ABSENT = 'MANUAL_ABSENT',
  REVERT_ABSENT = 'REVERT_ABSENT',
  CHECKIN = 'CHECKIN',
  REVERT_CHECKIN = 'REVERT_CHECKIN',
  PERFIL_NUTRICIONISTA_ACTUALIZADO = 'PERFIL_NUTRICIONISTA_ACTUALIZADO',
  PREFERENCIAS_IA_EDITADAS = 'PREFERENCIAS_IA_EDITADAS',
  FEEDBACK_CREADO = 'FEEDBACK_CREADO',
  FEEDBACK_EDITADO = 'FEEDBACK_EDITADO',
  MEMORIA_IA_ARCHIVADA = 'MEMORIA_IA_ARCHIVADA',
  // === Plan IA v2 — máquina de estados (Packet 4) ===
  PLAN_REGENERADO = 'PLAN_REGENERADO',
  PLAN_ACTIVADO = 'PLAN_ACTIVADO',
  PLAN_FINALIZADO_ACCION = 'PLAN_FINALIZADO_ACCION',
}

@Entity('auditoria')
@Index('idx_auditoria_timestamp', ['timestamp'])
@Index('idx_auditoria_usuario', ['usuario'])
@Index('idx_auditoria_accion', ['accion'])
@Index('idx_auditoria_gimnasio', ['gimnasioId'])
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
    type: 'json',
    nullable: true,
  })
  metadata: Record<string, unknown> | null;

  /** ID del gimnasio/tenant asociado a esta auditoria */
  @Column({ name: 'id_gimnasio', type: 'int', nullable: true })
  gimnasioId: number | null;

  @ManyToOne(() => GimnasioOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_gimnasio' })
  gimnasio: GimnasioOrmEntity | null;
}
