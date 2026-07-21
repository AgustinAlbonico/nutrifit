import { Injectable } from '@nestjs/common';
import { UsuarioOrmEntity } from '../entities/usuario.entity';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioEntity } from 'src/domain/entities/Usuario/usuario.entity';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  PerfilUsuario,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { PersonaEntity } from 'src/domain/entities/Persona/persona.entity';
import {
  PersonaOrmEntity,
  SocioOrmEntity,
  NutricionistaOrmEntity,
} from '../entities/persona.entity';
import { GrupoPermisoEntity } from 'src/domain/entities/Usuario/grupo-permiso.entity';
import { AccionPermisoEntity } from 'src/domain/entities/Usuario/accion-permiso.entity';
import { GrupoPermisoOrmEntity } from '../entities/grupo-permiso.entity';
import { AccionOrmEntity } from '../entities/accion.entity';

@Injectable()
export class UsuarioRepositoryImplementation implements UsuarioRepository {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly userRepository: Repository<UsuarioOrmEntity>,
  ) {}

  async findByEmail(email: string): Promise<UsuarioEntity | null> {
    if (!email) return null;

    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        // persona.gimnasioId es una columna directa en PersonaOrmEntity (id_gimnasio)
        // No requiere eager-loading de la relacion gimnasio.
        persona: true,
        acciones: true,
        usuariosGruposPermisos: {
          grupoPermiso: {
            acciones: true,
            hijos: {
              acciones: true,
            },
          },
        },
      },
    });

    if (!user) return null;

    const { idUsuario, contraseña, rol } = user;

    const grupos = (user.usuariosGruposPermisos ?? []).map(
      (ugp) => ugp.grupoPermiso,
    );

    const mapGrupo = (group: {
      id: number;
      clave: string;
      nombre: string;
      descripcion: string | null;
      acciones?: {
        id: number;
        clave: string;
        nombre: string;
        descripcion: string | null;
      }[];
      hijos?: {
        id: number;
        clave: string;
        nombre: string;
        descripcion: string | null;
        acciones?: {
          id: number;
          clave: string;
          nombre: string;
          descripcion: string | null;
        }[];
      }[];
    }): GrupoPermisoEntity =>
      new GrupoPermisoEntity(
        group.id,
        group.clave,
        group.nombre,
        group.descripcion,
        (group.acciones ?? []).map(
          (action) =>
            new AccionPermisoEntity(
              action.id,
              action.clave,
              action.nombre,
              action.descripcion,
            ),
        ),
        (group.hijos ?? []).map(
          (child) =>
            new GrupoPermisoEntity(
              child.id,
              child.clave,
              child.nombre,
              child.descripcion,
              (child.acciones ?? []).map(
                (action) =>
                  new AccionPermisoEntity(
                    action.id,
                    action.clave,
                    action.nombre,
                    action.descripcion,
                  ),
              ),
            ),
        ),
      );

    // Construir PersonaEntity con gimnasioId para tenant isolation.
    // PersonaEntity es abstracta; usamos un objeto plano que satisface la interfaz
    // y lo casteamos. fechaBaja existe en SocioOrmEntity y NutricionistaOrmEntity
    // (no en la base PersonaOrmEntity), por eso se usa type assertion.
    let formatedPersona: PersonaEntity | null = null;
    if (user.persona) {
      const personaOrm = user.persona as
        | SocioOrmEntity
        | NutricionistaOrmEntity;

      formatedPersona = {
        idPersona: user.persona.idPersona ?? null,
        idPersonaNullable: user.persona.idPersona ?? null,
        nombre: user.persona.nombre,
        apellido: user.persona.apellido,
        fechaNacimiento: user.persona.fechaNacimiento,
        telefono: user.persona.telefono,
        genero: user.persona.genero,
        direccion: user.persona.direccion,
        ciudad: user.persona.ciudad,
        provincia: user.persona.provincia,
        dni: user.persona.dni ?? '',
        email: user.persona.usuario?.email ?? '',
        fotoPerfilKey: user.persona.fotoPerfilKey,
        gimnasioId: user.persona.gimnasioId ?? 1,
        fechaBaja: personaOrm.fechaBaja ?? null,
      } as PersonaEntity;
    }

    const formatedUser = new UsuarioEntity(
      idUsuario,
      email,
      contraseña,
      formatedPersona,
      rol,
      grupos.map(mapGrupo),
      (user.acciones ?? []).map(
        (action) =>
          new AccionPermisoEntity(
            action.id,
            action.clave,
            action.nombre,
            action.descripcion,
          ),
      ),
      null,
      user.debeCambiarPassword,
      user.tokenRecuperacion,
      user.tokenRecuperacionExpiracion,
    );

    return formatedUser;
  }

  async findAdminByGimnasioId(
    gimnasioId: number,
  ): Promise<UsuarioEntity | null> {
    const user = await this.userRepository.findOne({
      where: {
        rol: Rol.ADMIN,
        persona: {
          gimnasioId,
          fechaBaja: IsNull(),
        },
      },
      order: { idUsuario: 'ASC' },
    });

    return user ? this.findByEmail(user.email) : null;
  }

  async findAllByRolAndGimnasioId(
    rol: Rol,
    gimnasioId: number,
  ): Promise<UsuarioEntity[]> {
    const users = await this.userRepository.find({
      where: {
        rol,
        persona: {
          gimnasioId,
          fechaBaja: IsNull(),
        },
      },
    });

    const result: UsuarioEntity[] = [];
    for (const user of users) {
      const fullUser = await this.findByEmail(user.email);
      if (fullUser) {
        result.push(fullUser);
      }
    }
    return result;
  }

  async findPersonaIdByUserId(userId: number): Promise<number | null> {
    const user = await this.userRepository.findOne({
      where: { idUsuario: userId },
      relations: {
        persona: true,
      },
    });

    return user?.persona?.idPersona ?? null;
  }

  async findPerfilByUserId(userId: number): Promise<PerfilUsuario | null> {
    const user = await this.userRepository.findOne({
      where: { idUsuario: userId },
      relations: {
        persona: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      idUsuario: user.idUsuario ?? userId,
      idPersona: user.persona?.idPersona ?? null,
      email: user.email,
      rol: user.rol,
      nombre: user.persona?.nombre ?? null,
      apellido: user.persona?.apellido ?? null,
      fotoPerfilKey: user.persona?.fotoPerfilKey ?? null,
    };
  }

  async save(entity: UsuarioEntity): Promise<UsuarioEntity> {
    const usuarioOrmEntity = new UsuarioOrmEntity();
    usuarioOrmEntity.idUsuario = null;
    usuarioOrmEntity.email = entity.email;
    usuarioOrmEntity.contraseña = entity.contraseña;
    usuarioOrmEntity.rol = entity.rol;
    usuarioOrmEntity.fechaHoraAlta = new Date();
    usuarioOrmEntity.debeCambiarPassword = entity.debeCambiarPassword;
    usuarioOrmEntity.tokenRecuperacion = entity.tokenRecuperacion;
    usuarioOrmEntity.tokenRecuperacionExpiracion =
      entity.tokenRecuperacionExpiracion;

    if (entity.persona) {
      usuarioOrmEntity.persona = {
        idPersona: entity.persona.idPersona,
      } as PersonaOrmEntity;
    }

    // Note: grupos and acciones are now managed via the join table usuario_grupo_permiso
    // The assignment of grupos to usuarioOrmEntity.grupos has been removed.
    // To assign grupos after creation, use PermisosService.asignarGruposAUsuario.

    usuarioOrmEntity.acciones = (entity.acciones ?? []).map(
      (accion) => ({ id: accion.id }) as AccionOrmEntity,
    );

    const usuarioCreado = await this.userRepository.save(usuarioOrmEntity);

    return new UsuarioEntity(
      usuarioCreado.idUsuario,
      usuarioCreado.email,
      usuarioCreado.contraseña,
      null,
      usuarioCreado.rol,
      [],
      [],
      null,
      usuarioCreado.debeCambiarPassword,
      usuarioCreado.tokenRecuperacion,
      usuarioCreado.tokenRecuperacionExpiracion,
    );
  }

  async update(id: number, entity: UsuarioEntity): Promise<UsuarioEntity> {
    await this.userRepository.update(id, {
      email: entity.email,
      contraseña: entity.contraseña,
      rol: entity.rol,
      debeCambiarPassword: entity.debeCambiarPassword,
      tokenRecuperacion: entity.tokenRecuperacion,
      tokenRecuperacionExpiracion: entity.tokenRecuperacionExpiracion,
    });

    return entity;
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  async findAll(): Promise<UsuarioEntity[]> {
    const users = await this.userRepository.find({
      relations: {
        acciones: true,
        usuariosGruposPermisos: {
          grupoPermiso: true,
        },
      },
    });

    return users.map((user) => {
      const grupos = (user.usuariosGruposPermisos ?? []).map(
        (ugp) => ugp.grupoPermiso,
      );
      const { idUsuario, email, contraseña, rol } = user;
      return new UsuarioEntity(
        idUsuario,
        email,
        contraseña,
        null,
        rol,
        grupos.map(
          (g) =>
            new GrupoPermisoEntity(
              g.id,
              g.clave,
              g.nombre,
              g.descripcion,
              [],
              [],
            ),
        ),
        (user.acciones ?? []).map(
          (a) =>
            new AccionPermisoEntity(a.id, a.clave, a.nombre, a.descripcion),
        ),
        null,
        user.debeCambiarPassword,
        user.tokenRecuperacion,
        user.tokenRecuperacionExpiracion,
      );
    });
  }

  async findByPersonaId(personaId: number): Promise<UsuarioEntity | null> {
    const user = await this.userRepository.findOne({
      where: {
        persona: { idPersona: personaId },
      },
      relations: {
        persona: true,
        acciones: true,
        usuariosGruposPermisos: {
          grupoPermiso: {
            acciones: true,
            hijos: {
              acciones: true,
            },
          },
        },
      },
    });

    if (!user) return null;

    const { idUsuario, email, contraseña, rol } = user;

    const grupos = (user.usuariosGruposPermisos ?? []).map(
      (ugp) => ugp.grupoPermiso,
    );

    const mapGrupo = (group: {
      id: number;
      clave: string;
      nombre: string;
      descripcion: string | null;
      acciones?: {
        id: number;
        clave: string;
        nombre: string;
        descripcion: string | null;
      }[];
      hijos?: {
        id: number;
        clave: string;
        nombre: string;
        descripcion: string | null;
        acciones?: {
          id: number;
          clave: string;
          nombre: string;
          descripcion: string | null;
        }[];
      }[];
    }): GrupoPermisoEntity =>
      new GrupoPermisoEntity(
        group.id,
        group.clave,
        group.nombre,
        group.descripcion,
        (group.acciones ?? []).map(
          (action) =>
            new AccionPermisoEntity(
              action.id,
              action.clave,
              action.nombre,
              action.descripcion,
            ),
        ),
        (group.hijos ?? []).map(
          (child) =>
            new GrupoPermisoEntity(
              child.id,
              child.clave,
              child.nombre,
              child.descripcion,
              (child.acciones ?? []).map(
                (action) =>
                  new AccionPermisoEntity(
                    action.id,
                    action.clave,
                    action.nombre,
                    action.descripcion,
                  ),
              ),
            ),
        ),
      );

    return new UsuarioEntity(
      idUsuario,
      email,
      contraseña,
      null,
      rol,
      grupos.map(mapGrupo),
      (user.acciones ?? []).map(
        (action) =>
          new AccionPermisoEntity(
            action.id,
            action.clave,
            action.nombre,
            action.descripcion,
          ),
      ),
      null,
      user.debeCambiarPassword,
      user.tokenRecuperacion,
      user.tokenRecuperacionExpiracion,
    );
  }

  async findByTokenRecuperacion(token: string): Promise<UsuarioEntity | null> {
    if (!token) return null;

    const user = await this.userRepository.findOne({
      where: { tokenRecuperacion: token },
    });

    if (!user) return null;
    return this.findByEmail(user.email);
  }
}
