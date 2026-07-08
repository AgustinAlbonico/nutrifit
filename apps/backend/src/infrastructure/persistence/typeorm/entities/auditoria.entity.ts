import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AccionAuditoria {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
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
  /**
   * Editada/revisada por un nutricionista en nombre del socio.
   * Acompaña al campo `revisadaPorNutricionistaAt` de FichaSaludOrmEntity.
   */
  FICHA_REVISADA_POR_NUTRICIONISTA = 'FICHA_REVISADA_POR_NUTRICIONISTA',
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

export enum TipoAccionAuditoria {
  RESERVA = 'RESERVA',
  BLOQUEO = 'BLOQUEO',
  CANCELACION = 'CANCELACION',
  AUSENCIA_AUTO = 'AUSENCIA_AUTO',
  CIERRE_AUTO = 'CIERRE_AUTO',
}

@Entity('audit_log')
@Index('idx_audit_log_fecha', ['fecha'])
@Index('idx_audit_log_usuario', ['usuarioId'])
@Index('idx_audit_log_accion', ['accion'])
@Index('idx_audit_log_modulo', ['modulo'])
@Index('idx_audit_log_entidad', ['entidad', 'entidadId'])
@Index('idx_audit_log_gimnasio_fecha', ['gimnasioId', 'fecha'])
export class AuditLogOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_audit_log' })
  idAuditLog: number;

  get idAuditoria(): number {
    return this.idAuditLog;
  }

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;

  get timestamp(): Date {
    return this.fecha;
  }

  @Column({ name: 'id_gimnasio', type: 'int', nullable: true })
  gimnasioId: number | null;

  @Column({
    name: 'id_usuario',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  usuarioId: string | null;

  @Column({ name: 'modulo', type: 'varchar', length: 100, default: 'legacy' })
  modulo: string;

  @Column({
    name: 'accion',
    type: 'varchar',
    length: 100,
  })
  accion: AccionAuditoria | string;

  @Column({
    name: 'entidad',
    type: 'varchar',
    length: 100,
  })
  entidad: string;

  @Column({
    name: 'entidad_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  entidadId: string | null;

  @Column({ name: 'tipo_accion', type: 'varchar', length: 50, nullable: true })
  tipoAccion: TipoAccionAuditoria | string | null;

  @Column({ name: 'descripcion', type: 'varchar', length: 500, nullable: true })
  descripcion: string | null;

  @Column({
    name: 'ip',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ip: string | null;

  get ipOrigen(): string | null {
    return this.ip;
  }

  @Column({
    name: 'user_agent',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  userAgent: string | null;

  @Column({
    name: 'metadata_legacy',
    type: 'json',
    nullable: true,
  })
  metadataLegacy: Record<string, unknown> | null;

  get metadata(): Record<string, unknown> | null {
    return this.metadataLegacy;
  }

  @Column({
    name: 'valores_antes',
    type: 'json',
    nullable: true,
  })
  valoresAntes: Record<string, unknown> | null;

  @Column({
    name: 'valores_despues',
    type: 'json',
    nullable: true,
  })
  valoresDespues: Record<string, unknown> | null;
}

export { AuditLogOrmEntity as AuditoriaOrmEntity };
