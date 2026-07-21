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
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from 'src/domain/exceptions/custom-exceptions';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import * as crypto from 'crypto';

@Injectable()
export class ResetearContrasenaUsuarioUseCase implements BaseUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(payload: {
    targetUserId: number;
    adminUserId: number;
  }): Promise<{ contrasenaProvisional: string }> {
    const { targetUserId, adminUserId } = payload;
    this.logger.log(
      `ResetearContrasenaUsuarioUseCase: El admin ID ${adminUserId} intenta resetear la clave del usuario ID ${targetUserId}`,
    );

    const admin = await this.usuarioRepository.findPerfilByUserId(adminUserId);
    if (!admin) {
      throw new ForbiddenError('No tenés permisos para realizar esta acción.');
    }

    const usuarioTarget = await this.usuarioRepository.findByEmail(
      (await this.usuarioRepository.findPerfilByUserId(targetUserId))?.email ??
        '',
    );
    if (!usuarioTarget) {
      throw new NotFoundError('No se encontró el usuario a resetear.');
    }

    // Aislamiento multi-tenant
    if (admin.rol !== Rol.SUPERADMIN) {
      const targetGymId = usuarioTarget.persona?.gimnasioId;
      const adminGymId = admin.idPersona
        ? (await this.usuarioRepository.findByEmail(admin.email))?.persona
            ?.gimnasioId
        : null;

      if (!targetGymId || !adminGymId || targetGymId !== adminGymId) {
        this.logger.warn(
          `Intento de reset cross-tenant: Admin ID ${adminUserId} (Gym: ${adminGymId}) -> Target ID ${targetUserId} (Gym: ${targetGymId})`,
        );
        throw new ForbiddenError(
          'No tenés permisos para resetear la contraseña de este usuario.',
        );
      }
    }

    // Generar contraseña temporal (8 caracteres)
    const contrasenaProvisional = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await this.passwordEncrypter.encryptPassword(
      contrasenaProvisional,
    );

    usuarioTarget.contraseña = hashedPassword;
    usuarioTarget.debeCambiarPassword = true;
    usuarioTarget.tokenRecuperacion = null;
    usuarioTarget.tokenRecuperacionExpiracion = null;

    await this.usuarioRepository.update(
      usuarioTarget.idUsuario!,
      usuarioTarget,
    );

    this.logger.log(
      `ResetearContrasenaUsuarioUseCase: Clave reseteada con éxito para el usuario ID ${targetUserId}. Flag debeCambiarPassword activado.`,
    );

    return { contrasenaProvisional };
  }
}
