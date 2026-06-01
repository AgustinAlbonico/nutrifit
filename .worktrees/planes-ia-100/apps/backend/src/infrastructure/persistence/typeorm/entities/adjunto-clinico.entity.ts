import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TurnoOrmEntity } from './turno.entity';
import { UsuarioOrmEntity } from './usuario.entity';

@Entity('adjunto_clinico')
@Index('idx_adjunto_clinico_turno', ['turno'])
export class AdjuntoClinicoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_adjunto' })
  idAdjunto: number;

  @Column({
    name: 'nombre_original',
    type: 'varchar',
    length: 255,
  })
  nombreOriginal: string;

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 100,
  })
  mimeType: string;

  @Column({
    name: 'size_bytes',
    type: 'int',
  })
  sizeBytes: number;

  @Column({
    name: 'object_key',
    type: 'varchar',
    length: 500,
  })
  objectKey: string;

  @ManyToOne(() => TurnoOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_turno' })
  turno: TurnoOrmEntity;

  @Column({
    name: 'id_turno',
    type: 'int',
  })
  turnoId: number;

  @ManyToOne(() => UsuarioOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario_subio' })
  usuarioSubio: UsuarioOrmEntity;

  @Column({
    name: 'id_usuario_subio',
    type: 'int',
  })
  usuarioSubioId: number;

  @Column({
    name: 'es_post_cierre',
    type: 'boolean',
    default: false,
  })
  esPostCierre: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
