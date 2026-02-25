import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UpdateNutricionistaDto } from '../dtos/update-nutricionista.dto';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  IPasswordEncrypterService,
  PASSWORD_ENCRYPTER_SERVICE,
} from 'src/domain/services/password-encrypter.service';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import {
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class UpdateNutricionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
  ) {}

  async execute(
    id: number,
    payload: UpdateNutricionistaDto,
    fotoPerfilKey?: string,
  ): Promise<NutricionistaEntity> {
    // Find existing nutricionista
    const nutricionista = await this.nutricionistaRepository.findById(id);
    if (!nutricionista) {
      this.logger.warn(`Nutricionista con ID ${id} no encontrado.`);
      throw new NotFoundError('Nutricionista no encontrado.');
    }

    // Find associated usuario
    const todosUsuarios = await this.usuarioRepository.findAll();
    const usuario = todosUsuarios.find(
      (u) => u.persona?.idPersona === nutricionista.idPersona,
    );
    const currentEmail = usuario?.email;

    // Validate email uniqueness (if changed)
    if (payload.email && currentEmail && payload.email !== currentEmail) {
      const foundByEmail = await this.usuarioRepository.findByEmail(
        payload.email,
      );
      if (foundByEmail) {
        this.logger.warn(`El email ${payload.email} ya está registrado.`);
        throw new ConflictError('El email ya está registrado.');
      }
    }

    // Validate DNI uniqueness (if changed)
    if (payload.dni && payload.dni !== nutricionista.dni) {
      const foundByDni = await this.nutricionistaRepository.findByDni(
        payload.dni,
      );
      if (foundByDni) {
        this.logger.warn(`El DNI ${payload.dni} ya está registrado.`);
        throw new ConflictError('El DNI ya está registrado.');
      }
    }

    // Validate Matrícula uniqueness (if changed)
    if (payload.matricula && payload.matricula !== nutricionista.matricula) {
      const foundByMatricula =
        await this.nutricionistaRepository.findByMatricula(payload.matricula);
      if (foundByMatricula) {
        this.logger.warn(
          `La matrícula ${payload.matricula} ya está registrada.`,
        );
        throw new ConflictError('La matrícula ya está registrada.');
      }
    }

    // Update nutricionista fields
    if (payload.nombre) nutricionista.nombre = payload.nombre;
    if (payload.apellido) nutricionista.apellido = payload.apellido;
    if (payload.fechaNacimiento)
      nutricionista.fechaNacimiento = new Date(payload.fechaNacimiento);
    if (payload.telefono) nutricionista.telefono = payload.telefono;
    if (payload.genero) nutricionista.genero = payload.genero;
    if (payload.direccion) nutricionista.direccion = payload.direccion;
    if (payload.ciudad) nutricionista.ciudad = payload.ciudad;
    if (payload.provincia) nutricionista.provincia = payload.provincia;
    if (payload.dni) nutricionista.dni = payload.dni;
    if (payload.matricula) nutricionista.matricula = payload.matricula;
    if (payload.tarifaSesion !== undefined)
      nutricionista.tarifaSesion = payload.tarifaSesion;
    if (payload.añosExperiencia !== undefined)
      nutricionista.añosExperiencia = payload.añosExperiencia;

    // Update foto de perfil if provided
    if (fotoPerfilKey) {
      nutricionista.fotoPerfilKey = fotoPerfilKey;
    }

    // Update nutricionista
    const nutricionistaActualizado = await this.nutricionistaRepository.update(
      id,
      nutricionista,
    );

    // Update usuario email and password if provided
    if (usuario) {
      if (payload.email) {
        usuario.email = payload.email;
      }
      if (payload.contrasena) {
        usuario.contraseña = await this.passwordEncrypter.encryptPassword(
          payload.contrasena,
        );
      }
      if (payload.email || payload.contrasena) {
        await this.usuarioRepository.update(usuario.idUsuario!, usuario);
      }
    }

    this.logger.log(
      `Nutricionista ${id} actualizado: ${nutricionistaActualizado.nombre}`,
    );

    return nutricionistaActualizado;
  }
}
