import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PersonaOrmEntity } from './persona.entity';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { GrupoPermisoOrmEntity } from './grupo-permiso.entity';
import { AccionOrmEntity } from './accion.entity';
import { UsuarioGrupoPermisoOrmEntity } from './usuario-grupo-permiso.entity';

@Entity('usuario')
export class UsuarioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number | null;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'contrasenia', type: 'varchar', length: 255 })
  contraseña: string;

  @Column({
    name: 'debe_cambiar_password',
    type: 'tinyint',
    width: 1,
    default: 0,
    transformer: {
      to: (value: boolean | null | undefined): number => (value ? 1 : 0),
      from: (value: number | null | undefined): boolean => Boolean(value),
    },
  })
  debeCambiarPassword: boolean;

  @Column({
    name: 'token_recuperacion',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  tokenRecuperacion: string | null;

  @Column({
    name: 'token_recuperacion_expiracion',
    type: 'datetime',
    nullable: true,
  })
  tokenRecuperacionExpiracion: Date | null;

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

  @OneToMany(() => UsuarioGrupoPermisoOrmEntity, (ugp) => ugp.usuario)
  usuariosGruposPermisos: UsuarioGrupoPermisoOrmEntity[];

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
