import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GrupoPermisoOrmEntity } from './grupo-permiso.entity';
import { UsuarioOrmEntity } from './usuario.entity';

@Entity('usuario_grupo_permiso')
export class UsuarioGrupoPermisoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_usuario_grupo_permiso' })
  id: number;

  @Column({ name: 'id_gimnasio', type: 'int', nullable: true })
  gimnasioId: number | null;

  @ManyToOne(
    () => UsuarioOrmEntity,
    (usuario) => usuario.usuariosGruposPermisos,
    {
      onDelete: 'CASCADE',
    },
  )
  usuario: UsuarioOrmEntity;

  @ManyToOne(
    () => GrupoPermisoOrmEntity,
    (grupo) => grupo.usuariosGruposPermisos,
    {
      onDelete: 'CASCADE',
    },
  )
  grupoPermiso: GrupoPermisoOrmEntity;

  @CreateDateColumn({ name: 'fecha_asignacion' })
  fechaAsignacion: Date;
}
