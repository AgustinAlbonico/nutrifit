import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import type { ProveedorIa } from 'src/application/ia-configuracion/ia-configuracion.types';

@Entity('ia_configuracion')
@Unique('uq_ia_configuracion_provider_gimnasio', ['provider', 'gimnasioId'])
@Index('idx_ia_configuracion_orden', ['habilitado', 'orden'])
export class IaConfiguracionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_ia_configuracion', type: 'int' })
  idIaConfiguracion: number;

  @Column({ name: 'provider', type: 'varchar', length: 50 })
  provider: ProveedorIa;

  @Column({ name: 'api_key_encrypted', type: 'text', nullable: true })
  apiKeyEncrypted: string | null;

  @Column({ name: 'model', type: 'varchar', length: 255, nullable: true })
  model: string | null;

  @Column({ name: 'base_url', type: 'varchar', length: 500, nullable: true })
  baseUrl: string | null;

  @Column({ name: 'max_tokens', type: 'int', nullable: true })
  maxTokens: number | null;

  @Column({
    name: 'temperature',
    type: 'decimal',
    precision: 4,
    scale: 3,
    nullable: true,
  })
  temperature: string | null;

  @Column({ name: 'timeout_ms', type: 'int', nullable: true })
  timeoutMs: number | null;

  @Column({ name: 'habilitado', type: 'boolean', default: true })
  habilitado: boolean;

  @Column({ name: 'orden', type: 'int', default: 0 })
  orden: number;

  @Column({ name: 'gimnasio_id', type: 'int', nullable: true })
  gimnasioId: number | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  actualizadoEn: Date;
}
