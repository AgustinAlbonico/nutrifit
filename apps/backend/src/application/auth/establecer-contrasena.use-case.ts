import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { EstablecerContrasenaDto } from './dtos/establecer-contrasena.dto';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import {
  IPasswordEncrypterService,
  PASSWORD_ENCRYPTER_SERVICE,
} from 'src/domain/services/password-encrypter.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
} from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class EstablecerContrasenaUseCase implements BaseUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    userId: number,
    email: string,
    payload: EstablecerContrasenaDto,
  ): Promise<{ mensaje: string }> {
    this.logger.log(
      `EstablecerContrasenaUseCase: Estableciendo contraseña para usuario ID ${userId}`,
    );

    const { nuevaContrasena } = payload;

    const usuario = await this.usuarioRepository.findByEmail(email);

    if (!usuario) {
      this.logger.warn(`Usuario ${email} no encontrado.`);
      throw new UnauthorizedError('No se encontró el usuario.');
    }

    if (!usuario.debeCambiarPassword) {
      throw new ForbiddenError(
        'No es necesario cambiar la contraseña en este momento.',
      );
    }

    if (nuevaContrasena.length < 8) {
      throw new BadRequestError(
        'La nueva contraseña debe tener al menos 8 caracteres.',
      );
    }

    if (!/[A-Z]/.test(nuevaContrasena)) {
      throw new BadRequestError(
        'La nueva contraseña debe contener al menos una letra mayúscula.',
      );
    }

    if (!/[a-z]/.test(nuevaContrasena)) {
      throw new BadRequestError(
        'La nueva contraseña debe contener al menos una letra minúscula.',
      );
    }

    if (!/\d/.test(nuevaContrasena)) {
      throw new BadRequestError(
        'La nueva contraseña debe contener al menos un número.',
      );
    }

    if (!/[^A-Za-z0-9]/.test(nuevaContrasena)) {
      throw new BadRequestError(
        'La nueva contraseña debe contener al menos un símbolo especial.',
      );
    }

    const isSamePassword = await this.passwordEncrypter.comparePasswords(
      nuevaContrasena,
      usuario.contraseña,
    );

    if (isSamePassword) {
      throw new BadRequestError(
        'La nueva contraseña debe ser diferente a la actual.',
      );
    }

    const hashedPassword =
      await this.passwordEncrypter.encryptPassword(nuevaContrasena);

    usuario.contraseña = hashedPassword;
    usuario.debeCambiarPassword = false;
    await this.usuarioRepository.update(usuario.idUsuario!, usuario);

    this.logger.log(
      `Contraseña establecida exitosamente para usuario ID ${userId}. Flag debeCambiarPassword reseteado.`,
    );

    return { mensaje: 'Contraseña establecida correctamente.' };
  }
}
