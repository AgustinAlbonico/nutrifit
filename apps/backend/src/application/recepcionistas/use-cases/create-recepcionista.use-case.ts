import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { CreateRecepcionistaDto } from '../dtos/create-recepcionista.dto';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import {
  RECEPCIONISTA_REPOSITORY,
  RecepcionistaRepository,
} from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { UsuarioEntity } from 'src/domain/entities/Usuario/usuario.entity';
import {
  IPasswordEncrypterService,
  PASSWORD_ENCRYPTER_SERVICE,
} from 'src/domain/services/password-encrypter.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { Repository } from 'typeorm';
import { GrupoPermisoEntity } from 'src/domain/entities/Usuario/grupo-permiso.entity';

@Injectable()
export class CreateRecepcionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(RECEPCIONISTA_REPOSITORY)
    private readonly recepcionistaRepository: RecepcionistaRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoPermisoRepository: Repository<GrupoPermisoOrmEntity>,
  ) {}

  async execute(
    payload: CreateRecepcionistaDto,
    fotoPerfilKey?: string,
  ): Promise<RecepcionistaEntity> {
    const foundByEmail = await this.usuarioRepository.findByEmail(
      payload.email,
    );
    if (foundByEmail) {
      this.logger.warn(`El email ${payload.email} ya está registrado.`);
      throw new ConflictError('El email ya está registrado.');
    }

    const foundByDni = await this.recepcionistaRepository.findByDni(
      payload.dni,
    );
    if (foundByDni) {
      this.logger.warn(`El DNI ${payload.dni} ya está registrado.`);
      throw new ConflictError('El DNI ya está registrado.');
    }

    const {
      nombre,
      apellido,
      fechaNacimiento,
      telefono,
      genero,
      direccion,
      ciudad,
      provincia,
      dni,
    } = payload;

    const recepcionistaEntity = new RecepcionistaEntity(
      null,
      nombre,
      apellido,
      new Date(fechaNacimiento),
      telefono,
      genero,
      direccion,
      ciudad,
      provincia,
      dni,
      null,
    );

    if (fotoPerfilKey) {
      recepcionistaEntity.fotoPerfilKey = fotoPerfilKey;
    }

    const recepcionistaCreado =
      await this.recepcionistaRepository.save(recepcionistaEntity);

    this.logger.log(
      `Recepcionista ${recepcionistaCreado.idPersona} creado: ${recepcionistaCreado.nombre}`,
    );

    const contraseñaEncriptada = await this.passwordEncrypter.encryptPassword(
      payload.contrasena,
    );

    const grupoStaff = await this.obtenerGrupoStaffPorDefecto();

    const usuario = new UsuarioEntity(
      null,
      payload.email,
      contraseñaEncriptada,
      recepcionistaCreado,
      Rol.RECEPCIONISTA,
      [grupoStaff],
    );

    await this.usuarioRepository.save(usuario);

    this.logger.log(
      `Usuario creado para recepcionista: ${recepcionistaCreado.idPersona}`,
    );

    return recepcionistaCreado;
  }

  private async obtenerGrupoStaffPorDefecto(): Promise<GrupoPermisoEntity> {
    // Si no existe el grupo ADMIN para staff (o uno específico STAFF), asignamos ADMIN por simplicidad.
    // Depende del seed.
    const grupo = await this.grupoPermisoRepository.findOne({
      where: { clave: 'ADMIN' },
    });

    if (!grupo) {
      throw new BadRequestException(
        'No existe el grupo ADMIN. Debe estar cargado por seed.',
      );
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
