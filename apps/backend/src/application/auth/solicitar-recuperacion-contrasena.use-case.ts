import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { EmailService } from 'src/application/email/email.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class SolicitarRecuperacionContrasenaUseCase implements BaseUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    private readonly emailService: EmailService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(payload: { email: string }): Promise<{ mensaje: string }> {
    const { email } = payload;
    this.logger.log(
      `SolicitarRecuperacionContrasenaUseCase: Solicitando recuperación para email: ${email}`,
    );

    const usuario = await this.usuarioRepository.findByEmail(email);

    // Por seguridad, si el usuario no existe no revelamos el error.
    if (!usuario) {
      this.logger.warn(
        `SolicitarRecuperacionContrasenaUseCase: Email ${email} no está registrado. Simulando éxito.`,
      );
      return {
        mensaje:
          'Si el correo electrónico está registrado, recibirás un enlace de recuperación.',
      };
    }

    const token = randomBytes(32).toString('hex');
    const unaHoraMs = 60 * 60 * 1000;
    const expiracion = new Date(Date.now() + unaHoraMs);

    usuario.tokenRecuperacion = createHash('sha256')
      .update(token)
      .digest('hex');
    usuario.tokenRecuperacionExpiracion = expiracion;

    await this.usuarioRepository.update(usuario.idUsuario!, usuario);

    const baseUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const enlaceRestablecimiento = `${normalizedBaseUrl}/recuperar-contrasena?token=${token}`;

    const html = `
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>NutriFit Supervisor</strong>.</p>
      <p>Para continuar con el restablecimiento de tu contraseña, hacé clic en el siguiente enlace:</p>
      <p><a href="${enlaceRestablecimiento}" target="_blank">${enlaceRestablecimiento}</a></p>
      <p>Este enlace vencerá en 1 hora.</p>
      <p>Si no solicitaste este cambio, podés ignorar este correo de forma segura.</p>
    `.trim();

    await this.emailService.enviarEmail({
      para: usuario.email,
      asunto: 'Restablece tu contraseña - NutriFit Supervisor',
      html,
      gimnasioId: usuario.persona?.gimnasioId ?? undefined,
    });

    this.logger.log(
      `SolicitarRecuperacionContrasenaUseCase: Email enviado a ${email} con token de recuperación.`,
    );

    return {
      mensaje:
        'Si el correo electrónico está registrado, recibirás un enlace de recuperación.',
    };
  }
}
