import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
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
import { RecepcionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { generarContrasenaProvisional } from 'src/common/utils/password-generator.util';
import { EmailService } from 'src/application/email/email.service';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';

export interface ResultadoCrearAdmin {
  usuarioId: number;
  personaId: number;
  contrasenaProvisional: string;
}

@Injectable()
export class CrearAdminGimnasioUseCase implements BaseUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoPermisoRepository: Repository<GrupoPermisoOrmEntity>,
    @InjectRepository(RecepcionistaOrmEntity)
    private readonly personaRepository: Repository<RecepcionistaOrmEntity>,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    nombre: string,
    email: string,
    gimnasioId: number,
  ): Promise<ResultadoCrearAdmin> {
    const found = await this.usuarioRepository.findByEmail(email);
    if (found) {
      this.logger.warn(`El email ${email} ya está registrado.`);
      throw new ConflictError('El email ya está registrado.');
    }

    const personaOrm = new RecepcionistaOrmEntity();
    personaOrm.idPersona = null;
    personaOrm.nombre = nombre;
    personaOrm.apellido = '';
    personaOrm.fechaNacimiento = new Date('1990-01-01');
    personaOrm.genero = Genero.Otro;
    personaOrm.telefono = 'Sin teléfono';
    personaOrm.direccion = 'Sin dirección';
    personaOrm.ciudad = 'Sin ciudad';
    personaOrm.provincia = 'Sin provincia';
    personaOrm.dni = null;
    personaOrm.fotoPerfilKey = null;
    personaOrm.gimnasioId = gimnasioId;
    personaOrm.fechaBaja = null;

    const personaCreada = await this.personaRepository.save(personaOrm);

    this.logger.log(
      `Persona creada para admin ${email}: ID ${personaCreada.idPersona}`,
    );

    const contrasenaProvisional = generarContrasenaProvisional();
    const contraseñaEncriptada = await this.passwordEncrypter.encryptPassword(
      contrasenaProvisional,
    );

    const grupoStaff = await this.obtenerGrupoStaffPorDefecto();

    const personaRef = new RecepcionistaEntity(
      personaCreada.idPersona,
      nombre,
      '',
      new Date('1990-01-01'),
      'Sin teléfono',
      Genero.Otro,
      'Sin dirección',
      'Sin ciudad',
      'Sin provincia',
      '',
      null,
    );

    const usuario = new UsuarioEntity(
      null,
      email,
      contraseñaEncriptada,
      personaRef,
      Rol.ADMIN,
      [grupoStaff],
      [],
      null,
      true,
    );

    await this.usuarioRepository.save(usuario);

    this.logger.log(
      `Usuario ADMIN creado para ${email} (debe_cambiar_password=true)`,
    );

    void this.emailService
      .enviarBienvenida({
        nombre,
        email,
        contrasenaProvisional,
        rol: 'ADMIN',
      })
      .catch((error) => {
        this.logger.warn(
          `No se pudo enviar email de bienvenida a ${email}: ${error instanceof Error ? error.message : String(error)}`,
        );
      });

    return {
      usuarioId: personaCreada.idPersona ?? 0,
      personaId: personaCreada.idPersona ?? 0,
      contrasenaProvisional,
    };
  }

  private async obtenerGrupoStaffPorDefecto(): Promise<GrupoPermisoEntity> {
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
