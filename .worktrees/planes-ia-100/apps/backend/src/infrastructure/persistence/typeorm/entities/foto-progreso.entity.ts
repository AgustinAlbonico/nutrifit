import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SocioOrmEntity } from './persona.entity';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';

@Entity('foto_progreso')
export class FotoProgresoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_foto' })
  idFoto: number;

  @ManyToOne(() => SocioOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'id_socio' })
  socio: SocioOrmEntity;

  @Column({ name: 'tipo_foto', type: 'enum', enum: TipoFoto })
  tipoFoto: TipoFoto;

  @Column({ name: 'object_key', type: 'varchar', length: 255 })
  objectKey: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType: string;

  @Column({ name: 'notas', type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
