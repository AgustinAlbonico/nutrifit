import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
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
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class ConfirmarRecuperacionContrasenaUseCase implements BaseUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(payload: {
    token: string;
    nuevaContrasena: string;
  }): Promise<{ mensaje: string }> {
    const { token, nuevaContrasena } = payload;
    this.logger.log(
      'ConfirmarRecuperacionContrasenaUseCase: Intentando confirmar recuperación con token.',
    );

    if (!token) {
      throw new BadRequestError('El token es requerido.');
    }

    const usuario = await this.usuarioRepository.findByTokenRecuperacion(token);

    if (!usuario || !usuario.tokenRecuperacion) {
      this.logger.warn(
        'ConfirmarRecuperacionContrasenaUseCase: Token no coincide con ningún usuario activo.',
      );
      throw new BadRequestError('El enlace de recuperación es inválido.');
    }

    if (
      usuario.tokenRecuperacionExpiracion &&
      usuario.tokenRecuperacionExpiracion < new Date()
    ) {
      this.logger.warn(
        `ConfirmarRecuperacionContrasenaUseCase: Token expirado para usuario ID ${usuario.idUsuario}.`,
      );
      throw new BadRequestError('El enlace de recuperación ha expirado.');
    }

    // Validar contraseña
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

    const hashedPassword =
      await this.passwordEncrypter.encryptPassword(nuevaContrasena);

    usuario.contraseña = hashedPassword;
    usuario.tokenRecuperacion = null;
    usuario.tokenRecuperacionExpiracion = null;
    usuario.debeCambiarPassword = false;

    await this.usuarioRepository.update(usuario.idUsuario!, usuario);

    this.logger.log(
      `ConfirmarRecuperacionContrasenaUseCase: Contraseña restablecida correctamente para usuario ID ${usuario.idUsuario}.`,
    );

    return { mensaje: 'Contraseña restablecida correctamente.' };
  }
}
