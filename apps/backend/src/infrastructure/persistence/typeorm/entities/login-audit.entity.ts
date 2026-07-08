import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ResultadoLoginAudit {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  BLOCKED = 'BLOCKED',
  LOGOUT = 'LOGOUT',
  REFRESH_SUCCESS = 'REFRESH_SUCCESS',
  REFRESH_FAILURE = 'REFRESH_FAILURE',
}

@Entity('login_audit')
@Index('idx_login_audit_fecha', ['fecha'])
@Index('idx_login_audit_usuario', ['usuarioId'])
@Index('idx_login_audit_email', ['emailIntentado'])
@Index('idx_login_audit_resultado', ['resultado'])
@Index('idx_login_audit_gimnasio_fecha', ['gimnasioId', 'fecha'])
export class LoginAuditOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_login_audit' })
  idLoginAudit: number;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;

  @Column({ name: 'id_usuario', type: 'int', nullable: true })
  usuarioId: number | null;

  @Column({ name: 'email_intentado', type: 'varchar', length: 255, nullable: true })
  emailIntentado: string | null;

  @Column({ name: 'resultado', type: 'varchar', length: 20 })
  resultado: ResultadoLoginAudit;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ name: 'id_gimnasio', type: 'int', nullable: true })
  gimnasioId: number | null;
}
