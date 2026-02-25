import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccionOrmEntity } from './accion.entity';
import { UsuarioOrmEntity } from './usuario.entity';

@Entity('grupo_permiso')
export class GrupoPermisoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_grupo_permiso' })
  id: number;

  @Column({ name: 'clave', type: 'varchar', length: 100, unique: true })
  clave: string;

  @Column({ name: 'nombre', type: 'varchar', length: 120 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @ManyToMany(() => AccionOrmEntity, (accion) => accion.grupos, {
    eager: false,
  })
  @JoinTable({
    name: 'grupo_permiso_accion',
    joinColumn: { name: 'id_grupo_permiso', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_accion', referencedColumnName: 'id' },
  })
  acciones: AccionOrmEntity[];

  @ManyToMany(() => UsuarioOrmEntity, (usuario) => usuario.grupos)
  usuarios: UsuarioOrmEntity[];

  @ManyToMany(() => GrupoPermisoOrmEntity, {
    eager: false,
  })
  @JoinTable({
    name: 'grupo_permiso_hijo',
    joinColumn: { name: 'id_grupo_padre', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_grupo_hijo', referencedColumnName: 'id' },
  })
  hijos: GrupoPermisoOrmEntity[];
}
