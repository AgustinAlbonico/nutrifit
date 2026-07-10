import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  GIMNASIO_REPOSITORY,
  GimnasioRepository,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  IPasswordEncrypterService,
  PASSWORD_ENCRYPTER_SERVICE,
} from 'src/domain/services/password-encrypter.service';
import { UsuarioEntity } from 'src/domain/entities/Usuario/usuario.entity';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { GrupoPermisoEntity } from 'src/domain/entities/Usuario/grupo-permiso.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { RecepcionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';
import { SuscripcionGimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/suscripcion-gimnasio.entity';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';

export interface RegistroSuscripcionInput {
  gimnasio: {
    nombre: string;
    direccion: string;
    ciudad?: string;
    provincia?: string;
    telefono?: string;
  };
  admin: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    password: string;
  };
}

export interface RegistroSuscripcionOutput {
  gym: { id: number; nombre: string };
  subscription: { id: number; uuid: string; estado: string };
  usuarioId: number;
}

@Injectable()
export class IniciarRegistroSuscripcionUseCase implements BaseUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoPermisoRepository: Repository<GrupoPermisoOrmEntity>,
    @InjectRepository(UsuarioGrupoPermisoOrmEntity)
    private readonly usuarioGrupoRepo: Repository<UsuarioGrupoPermisoOrmEntity>,
    @InjectRepository(RecepcionistaOrmEntity)
    private readonly personaRepository: Repository<RecepcionistaOrmEntity>,
    @InjectRepository(SuscripcionGimnasioOrmEntity)
    private readonly suscripcionRepo: Repository<SuscripcionGimnasioOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    input: RegistroSuscripcionInput,
  ): Promise<RegistroSuscripcionOutput> {
    const found = await this.usuarioRepository.findByEmail(input.admin.email);
    if (found) {
      this.logger.warn(
        `Email ${input.admin.email} ya registrado en registro público`,
      );
      throw new ConflictError('El email ya está registrado.');
    }

    const gimnasioEntity = new GimnasioEntity({
      id: 0,
      nombre: input.gimnasio.nombre,
      direccion: input.gimnasio.direccion,
      telefono: input.gimnasio.telefono ?? null,
      email: null,
      ciudad: input.gimnasio.ciudad ?? null,
      fechaAlta: new Date(),
      fechaBaja: null,
    });
    const gimnasio = await this.gimnasioRepository.save(gimnasioEntity);

    const personaOrm = new RecepcionistaOrmEntity();
    personaOrm.idPersona = null;
    personaOrm.nombre = input.admin.nombre;
    personaOrm.apellido = input.admin.apellido;
    personaOrm.fechaNacimiento = new Date('1990-01-01');
    personaOrm.genero = Genero.Otro;
    personaOrm.telefono = input.admin.telefono;
    personaOrm.direccion = input.gimnasio.direccion;
    personaOrm.ciudad = input.gimnasio.ciudad ?? '';
    personaOrm.provincia = input.gimnasio.provincia ?? '';
    personaOrm.dni = null;
    personaOrm.fotoPerfilKey = null;
    personaOrm.gimnasioId = gimnasio.id;
    personaOrm.fechaBaja = null;
    const personaCreada = await this.personaRepository.save(personaOrm);

    const contraseñaEncriptada = await this.passwordEncrypter.encryptPassword(
      input.admin.password,
    );
    const grupoStaff = await this.obtenerGrupoStaffPorDefecto();

    const personaRef = new RecepcionistaEntity(
      personaCreada.idPersona,
      input.admin.nombre,
      input.admin.apellido,
      new Date('1990-01-01'),
      input.admin.telefono,
      Genero.Otro,
      input.gimnasio.direccion,
      input.gimnasio.ciudad ?? 'Sin ciudad',
      input.gimnasio.provincia ?? 'Sin provincia',
      '',
      null,
      gimnasio.id,
    );

    const usuario = new UsuarioEntity(
      null,
      input.admin.email,
      contraseñaEncriptada,
      personaRef,
      Rol.ADMIN,
      [grupoStaff],
      [],
      null,
      true,
    );
    const usuarioCreado = await this.usuarioRepository.save(usuario);

    const grupoAdminOrm = await this.grupoPermisoRepository.findOne({
      where: { clave: 'ADMIN' },
    });
    if (grupoAdminOrm && usuarioCreado.idUsuario) {
      await this.usuarioGrupoRepo.save(
        this.usuarioGrupoRepo.create({
          usuario: { idUsuario: usuarioCreado.idUsuario } as any,
          grupoPermiso: grupoAdminOrm,
          gimnasioId: null,
        }),
      );
    }

    const uuid = randomUUID();
    const suscripcion = await this.suscripcionRepo.save(
      this.suscripcionRepo.create({
        gimnasioId: gimnasio.id,
        monto: 99.99,
        estado: 'pendiente',
        uuid,
        usuarioIdAdmin: usuarioCreado.idUsuario,
      }),
    );

    this.logger.log(
      `Registro público: gym ${gimnasio.id} creado, admin ${input.admin.email}, suscripcion ${suscripcion.id} pendiente`,
    );

    return {
      gym: { id: gimnasio.id, nombre: gimnasio.nombre },
      subscription: {
        id: suscripcion.id,
        uuid: suscripcion.uuid,
        estado: suscripcion.estado,
      },
      usuarioId: usuarioCreado.idUsuario!,
    };
  }

  private async obtenerGrupoStaffPorDefecto(): Promise<GrupoPermisoEntity> {
    const grupo = await this.grupoPermisoRepository.findOne({
      where: { clave: 'ADMIN' },
    });
    if (!grupo) {
      throw new Error('No existe el grupo ADMIN. Debe estar cargado por seed.');
    }
    return new GrupoPermisoEntity(
      grupo.id,
      grupo.clave,
      grupo.nombre,
      grupo.descripcion,
      [],
      [],
    );
  }
}
