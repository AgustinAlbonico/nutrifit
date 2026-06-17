import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { CambiarContrasenaDto } from './dtos/cambiar-contrasena.dto';
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
} from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class CambiarContrasenaUseCase implements BaseUseCase {
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
    payload: CambiarContrasenaDto,
  ): Promise<{ mensaje: string; requiereRelogin?: boolean }> {
    this.logger.log(
      `CambiarContrasenaUseCase: Intentando cambiar contraseña para usuario ID ${userId}`,
    );

    const { contrasenaActual, nuevaContrasena } = payload;

    const usuario = await this.usuarioRepository.findByEmail(email);

    if (!usuario) {
      this.logger.warn(`Usuario ${email} no encontrado.`);
      throw new UnauthorizedError('No se encontró el usuario.');
    }

    const isPasswordValid = await this.passwordEncrypter.comparePasswords(
      contrasenaActual,
      usuario.contraseña,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Contraseña actual incorrecta para usuario ID ${userId}.`,
      );
      throw new UnauthorizedError('La contraseña actual es incorrecta.');
    }

    if (nuevaContrasena.length < 8) {
      throw new BadRequestError(
        'La nueva contraseña debe tener al least 8 caracteres.',
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
      `Contraseña cambiada exitosamente para usuario ID ${userId}. Flag debeCambiarPassword reseteado.`,
    );

    return { mensaje: 'Contraseña actualizada correctamente.' };
  }
}
