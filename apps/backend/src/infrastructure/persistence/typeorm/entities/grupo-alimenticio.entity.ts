import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('grupo_alimenticio')
export class GrupoAlimenticioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_grupo_alimenticio' })
  idGrupoAlimenticio: number;

  @Column({ name: 'descripcion', type: 'varchar', length: 255 })
  descripcion: string;
}
