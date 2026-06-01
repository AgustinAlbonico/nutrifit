import { Injectable } from '@nestjs/common';
import { UsuarioOrmEntity } from '../entities/usuario.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioEntity } from 'src/domain/entities/Usuario/usuario.entity';
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
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        // persona.gimnasioId es una columna directa en PersonaOrmEntity (id_gimnasio)
        // No requiere eager-loading de la relacion gimnasio.
        persona: true,
        acciones: true,
        grupos: {
          acciones: true,
          hijos: {
            acciones: true,
          },
        },
      },
    });

    if (!user) return null;

    const { idUsuario, contraseña, rol } = user;

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
      (user.grupos ?? []).map(mapGrupo),
      (user.acciones ?? []).map(
        (action) =>
          new AccionPermisoEntity(
            action.id,
            action.clave,
            action.nombre,
            action.descripcion,
          ),
      ),
    );

    return formatedUser;
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

    if (entity.persona) {
      usuarioOrmEntity.persona = {
        idPersona: entity.persona.idPersona,
      } as PersonaOrmEntity;
    }

    usuarioOrmEntity.grupos = (entity.grupos ?? []).map(
      (grupo) => ({ id: grupo.id }) as GrupoPermisoOrmEntity,
    );

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
    );
  }

  async update(id: number, entity: UsuarioEntity): Promise<UsuarioEntity> {
    return entity;
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findAll(): Promise<UsuarioEntity[]> {
    const users = await this.userRepository.find({
      relations: {
        acciones: true,
        grupos: true,
      },
    });

    return users.map((user) => {
      const { idUsuario, email, contraseña, rol } = user;
      return new UsuarioEntity(
        idUsuario,
        email,
        contraseña,
        null,
        rol,
        (user.grupos ?? []).map(
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
        grupos: {
          acciones: true,
          hijos: {
            acciones: true,
          },
        },
      },
    });

    if (!user) return null;

    const { idUsuario, email, contraseña, rol } = user;

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
      (user.grupos ?? []).map(mapGrupo),
      (user.acciones ?? []).map(
        (action) =>
          new AccionPermisoEntity(
            action.id,
            action.clave,
            action.nombre,
            action.descripcion,
          ),
      ),
    );
  }
}
