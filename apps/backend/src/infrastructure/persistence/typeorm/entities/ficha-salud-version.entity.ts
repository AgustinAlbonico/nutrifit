import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FichaSaludOrmEntity } from './ficha-salud.entity';
import { PersonaOrmEntity } from './persona.entity';
import { UsuarioOrmEntity } from './usuario.entity';

/**
 * Entidad TypeORM para la tabla `ficha_salud_version`.
 *
 * **REGLA DE INMUTABILIDAD**: la entidad NO expone métodos `update`/`delete`
 * desde el repository (FichaSaludVersionRepository — ver Task 1.16). Toda
 * escritura es solo INSERT. El down de la migración es la única vía para
 * borrar filas en operación normal (rollback).
 *
 * Mapeo:
 *   - PK auto-increment `id_ficha_salud_version`
 *   - FK `id_ficha_salud` → ficha_salud (CASCADE)
 *   - FK `id_socio` → persona (RESTRICT) + INDEX
 *   - `version` int, UNIQUE(id_ficha_salud, version)
 *   - `datos_json` simple-json (snapshot completo)
 *   - `created_at` timestamp (default CURRENT_TIMESTAMP)
 *   - `created_by` int NULL FK a usuario
 *   - INDEX sobre `created_at` para ordenar historial DESC
 *
 * No extiende `AuditableOrmEntity` (no tiene `fecha_baja`).
 *
 * RBs: RB50
 */
@Entity('ficha_salud_version')
@Index('idx_fsv_socio', ['idSocio'])
@Index('idx_fsv_created_at', ['createdAt'])
export class FichaSaludVersionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_ficha_salud_version' })
  idFichaSaludVersion: number;

  @Column({ name: 'id_ficha_salud', type: 'int' })
  idFichaSalud: number;

  @ManyToOne(() => FichaSaludOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_ficha_salud' })
  fichaSalud?: FichaSaludOrmEntity;

  @Column({ name: 'id_socio', type: 'int' })
  idSocio: number;

  @ManyToOne(() => PersonaOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_socio' })
  socio?: PersonaOrmEntity;

  @Column({ name: 'version', type: 'int', unique: false })
  version: number;

  @Column({ name: 'datos_json', type: 'simple-json' })
  datosJson: Record<string, unknown>;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @ManyToOne(() => UsuarioOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdByUsuario?: UsuarioOrmEntity | null;
}
