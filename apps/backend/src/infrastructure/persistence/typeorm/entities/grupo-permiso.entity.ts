import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccionOrmEntity } from './accion.entity';
import { UsuarioOrmEntity } from './usuario.entity';
import { UsuarioGrupoPermisoOrmEntity } from './usuario-grupo-permiso.entity';

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

  @Column({ name: 'es_grupo_sistema', type: 'boolean', default: false })
  esGrupoSistema: boolean;

  @ManyToMany(() => AccionOrmEntity, (accion) => accion.grupos, {
    eager: false,
  })
  @JoinTable({
    name: 'grupo_permiso_accion',
    joinColumn: { name: 'id_grupo_permiso', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_accion', referencedColumnName: 'id' },
  })
  acciones: AccionOrmEntity[];

  @OneToMany(() => UsuarioGrupoPermisoOrmEntity, (ugp) => ugp.grupoPermiso)
  usuariosGruposPermisos: UsuarioGrupoPermisoOrmEntity[];

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
