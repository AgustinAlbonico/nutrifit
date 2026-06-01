import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('grupo_alimenticio')
export class GrupoAlimenticioOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_grupo_alimenticio' })
  idGrupoAlimenticio: number;

  @Column({ name: 'descripcion', type: 'varchar', length: 255 })
  descripcion: string;
}
