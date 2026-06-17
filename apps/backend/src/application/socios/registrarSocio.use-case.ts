import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '../shared/use-case.base';
import { RegistrarSocioDto } from './dtos/registrarSocio.dto';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';
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
import { EmailService } from 'src/application/email/email.service';
import { generarContrasenaProvisional } from 'src/common/utils/password-generator.util';

export interface ResultadoRegistrarSocio {
  socio: SocioEntity;
  usuario: UsuarioEntity;
  contrasenaProvisional: string;
}

@Injectable()
export class RegistrarSocioUseCase implements BaseUseCase {
  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoPermisoRepository: Repository<GrupoPermisoOrmEntity>,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    payload: RegistrarSocioDto,
    fotoPerfilKey?: string,
  ): Promise<ResultadoRegistrarSocio> {
    const foundUser = await this.usuarioRepository.findByEmail(payload.email);
    if (foundUser) {
      this.logger.warn(`El email ${payload.email} ya está registrado.`);
      throw new ConflictError('El email ya está registrado.');
    }

    const {
      nombre,
      apellido,
      dni,
      fechaNacimiento,
      telefono,
      genero,
      direccion,
      ciudad,
      provincia,
    } = payload;

    const socioEntity = new SocioEntity(
      null,
      nombre,
      apellido,
      new Date(fechaNacimiento),
      telefono,
      genero,
      direccion,
      ciudad,
      provincia,
      dni ?? '',
      [],
      null,
      [],
    );

    if (fotoPerfilKey) {
      socioEntity.fotoPerfilKey = fotoPerfilKey;
    }

    const socioCreado = await this.socioRepository.save(socioEntity);

    this.logger.log(
      `Socio ${socioCreado.idPersona} registrado: ${socioCreado.nombre}`,
    );
    this.logger.log(`Creando Usuario para el socio ${socioCreado.idPersona}`);

    const contrasena = payload.contrasena ?? generarContrasenaProvisional();
    const debeCambiarPassword = !payload.contrasena;
    const contrasenaEncriptada =
      await this.passwordEncrypter.encryptPassword(contrasena);

    const grupoSocio = await this.obtenerGrupoSocioPorDefecto();

    const usuario = new UsuarioEntity(
      null,
      payload.email,
      contrasenaEncriptada,
      socioCreado,
      Rol.SOCIO,
      [grupoSocio],
      [],
      null,
      debeCambiarPassword,
    );

    const usuarioCreado = await this.usuarioRepository.save(usuario);

    usuarioCreado.persona = socioCreado;

    void this.emailService
      .enviarBienvenida({
        nombre: `${socioCreado.nombre} ${socioCreado.apellido}`,
        email: payload.email,
        contrasenaProvisional: contrasena,
        rol: 'SOCIO',
      })
      .catch((error) => {
        this.logger.warn(
          `No se pudo enviar email de bienvenida a ${payload.email}: ${error instanceof Error ? error.message : String(error)}`,
        );
      });

    return {
      socio: socioCreado,
      usuario: usuarioCreado,
      contrasenaProvisional: contrasena,
    };
  }

  private async obtenerGrupoSocioPorDefecto(): Promise<GrupoPermisoEntity> {
    const grupoSocio = await this.grupoPermisoRepository.findOne({
      where: { clave: 'SOCIO' },
    });

    if (!grupoSocio) {
      throw new BadRequestException(
        'No existe el grupo SOCIO. Debe estar cargado por seed antes de crear socios.',
      );
    }

    return new GrupoPermisoEntity(
      grupoSocio.id,
      grupoSocio.clave,
      grupoSocio.nombre,
      grupoSocio.descripcion,
      [],
      [],
    );
  }
}
