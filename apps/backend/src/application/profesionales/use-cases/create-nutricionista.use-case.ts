import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { CreateNutricionistaDto } from '../dtos/create-nutricionista.dto';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
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
export class CreateNutricionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoPermisoRepository: Repository<GrupoPermisoOrmEntity>,
  ) {}

  async execute(
    payload: CreateNutricionistaDto,
    fotoPerfilKey?: string,
  ): Promise<NutricionistaEntity> {
    // Validate email uniqueness
    const foundByEmail = await this.usuarioRepository.findByEmail(
      payload.email,
    );
    if (foundByEmail) {
      this.logger.warn(`El email ${payload.email} ya está registrado.`);
      throw new ConflictError('El email ya está registrado.');
    }

    // Validate DNI uniqueness
    const foundByDni = await this.nutricionistaRepository.findByDni(
      payload.dni,
    );
    if (foundByDni) {
      this.logger.warn(`El DNI ${payload.dni} ya está registrado.`);
      throw new ConflictError('El DNI ya está registrado.');
    }

    // Validate Matrícula uniqueness
    const foundByMatricula = await this.nutricionistaRepository.findByMatricula(
      payload.matricula,
    );
    if (foundByMatricula) {
      this.logger.warn(`La matrícula ${payload.matricula} ya está registrada.`);
      throw new ConflictError('La matrícula ya está registrada.');
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
      matricula,
      tarifaSesion,
      añosExperiencia,
    } = payload;

    // Create NutricionistaEntity
    const nutricionistaEntity = new NutricionistaEntity(
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
      añosExperiencia,
      tarifaSesion,
      [],
      [],
      [],
    );

    // Add matricula to entity
    nutricionistaEntity.matricula = matricula;

    // Add foto de perfil if provided
    if (fotoPerfilKey) {
      nutricionistaEntity.fotoPerfilKey = fotoPerfilKey;
    }

    // Save nutricionista
    const nutricionistaCreado =
      await this.nutricionistaRepository.save(nutricionistaEntity);

    this.logger.log(
      `Nutricionista ${nutricionistaCreado.idPersona} creado: ${nutricionistaCreado.nombre}`,
    );
    this.logger.log(
      `Creando Usuario para el nutricionista ${nutricionistaCreado.idPersona}`,
    );

    // Generate encrypted password
    const contraseñaEncriptada = await this.passwordEncrypter.encryptPassword(
      payload.contrasena,
    );

    const grupoProfesional = await this.obtenerGrupoProfesionalPorDefecto();

    // Create UsuarioEntity with NUTRICIONISTA role
    const usuario = new UsuarioEntity(
      null,
      payload.email,
      contraseñaEncriptada,
      nutricionistaCreado,
      Rol.NUTRICIONISTA,
      [grupoProfesional],
    );

    // Save usuario
    const usuarioCreado = await this.usuarioRepository.save(usuario);

    this.logger.log(
      `Usuario creado para nutricionista: ${nutricionistaCreado.idPersona}`,
    );

    return nutricionistaCreado;
  }

  private async obtenerGrupoProfesionalPorDefecto(): Promise<GrupoPermisoEntity> {
    const grupoProfesional = await this.grupoPermisoRepository.findOne({
      where: { clave: 'PROFESIONAL' },
    });

    if (!grupoProfesional) {
      throw new BadRequestException(
        'No existe el grupo PROFESIONAL. Debe estar cargado por seed antes de crear profesionales.',
      );
    }

    return new GrupoPermisoEntity(
      grupoProfesional.id,
      grupoProfesional.clave,
      grupoProfesional.nombre,
      grupoProfesional.descripcion,
      [],
      [],
    );
  }
}
