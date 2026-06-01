import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PersonaOrmEntity } from './persona.entity';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { GrupoPermisoOrmEntity } from './grupo-permiso.entity';
import { AccionOrmEntity } from './accion.entity';

@Entity('usuario')
export class UsuarioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number | null;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'contrasenia', type: 'varchar', length: 255 })
  contraseña: string;

  @Column({
    name: 'fecha_hora_alta',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaHoraAlta: Date;

  @OneToOne(() => PersonaOrmEntity, (persona) => persona.usuario, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'id_persona' })
  persona: PersonaOrmEntity | null;

  @Column({ name: 'rol', type: 'enum', enum: Rol })
  rol: Rol;

  @ManyToMany(() => GrupoPermisoOrmEntity, (grupo) => grupo.usuarios, {
    eager: false,
  })
  @JoinTable({
    name: 'usuario_grupo_permiso',
    joinColumn: { name: 'id_usuario', referencedColumnName: 'idUsuario' },
    inverseJoinColumn: { name: 'id_grupo_permiso', referencedColumnName: 'id' },
  })
  grupos: GrupoPermisoOrmEntity[];

  @ManyToMany(() => AccionOrmEntity, (accion) => accion.usuarios, {
    eager: false,
  })
  @JoinTable({
    name: 'usuario_accion',
    joinColumn: { name: 'id_usuario', referencedColumnName: 'idUsuario' },
    inverseJoinColumn: { name: 'id_accion', referencedColumnName: 'id' },
  })
  acciones: AccionOrmEntity[];
}
