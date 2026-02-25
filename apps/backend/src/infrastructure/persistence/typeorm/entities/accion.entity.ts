import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GrupoPermisoOrmEntity } from './grupo-permiso.entity';
import { UsuarioOrmEntity } from './usuario.entity';

@Entity('accion')
export class AccionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_accion' })
  id: number;

  @Column({ name: 'clave', type: 'varchar', length: 120, unique: true })
  clave: string;

  @Column({ name: 'nombre', type: 'varchar', length: 120 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @ManyToMany(() => GrupoPermisoOrmEntity, (grupo) => grupo.acciones)
  grupos: GrupoPermisoOrmEntity[];

  @ManyToMany(() => UsuarioOrmEntity, (usuario) => usuario.acciones)
  usuarios: UsuarioOrmEntity[];
}
