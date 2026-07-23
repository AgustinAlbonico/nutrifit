import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Almacena los JTI (JWT IDs) revocados tras logout. El JwtAuthGuard
 * consulta esta tabla antes de aprobar un request para invalidar
 * tokens cuyo logout haya sido solicitado.
 *
 * El {@link expiresAt} coincide con la expiracion natural del JWT: una vez
 * vencido el token, la fila puede purgarse sin afectar funcionalidad.
 */
@Entity('token_revocado')
@Index('idx_token_revocado_jti', ['jti'], { unique: true })
@Index('idx_token_revocado_expires', ['expiresAt'])
export class TokenRevocadoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_token_revocado' })
  idTokenRevocado: number;

  @Column({ name: 'jti', type: 'varchar', length: 36 })
  jti: string;

  @Column({ name: 'id_usuario', type: 'int' })
  usuarioId: number;

  @Column({ name: 'id_gimnasio', type: 'int', nullable: true })
  gimnasioId: number | null;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'revocado_en' })
  revocadoEn: Date;
}