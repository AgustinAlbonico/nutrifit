import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SmtpEmailProvider } from './smtp-email.provider';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('SmtpEmailProvider', () => {
  const enviarMail = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: enviarMail,
    });
  });

  it('parsea SMTP_PORT y SMTP_SECURE desde valores string de .env', () => {
    const configService = crearConfigService({
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      SMTP_USER: 'usuario-test',
      SMTP_PASS: 'password-test',
    });

    new SmtpEmailProvider(configService);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 465,
      secure: true,
      auth: {
        user: 'usuario-test',
        pass: 'password-test',
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  });

  it('usa puerto 587 cuando SMTP_PORT está vacío o inválido', () => {
    const configService = crearConfigService({
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '',
      SMTP_SECURE: 'false',
    });

    new SmtpEmailProvider(configService);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
      }),
    );
  });

  it('envía html y texto plano al transporter SMTP', async () => {
    const configService = crearConfigService({
      SMTP_FROM: 'no-reply@nutrifit.local',
    });
    const provider = new SmtpEmailProvider(configService);

    await provider.enviar({
      to: 'socio@test.com',
      subject: 'Bienvenido',
      html: '<p>Hola</p>',
      text: 'Hola',
    });

    expect(enviarMail).toHaveBeenCalledWith({
      from: 'no-reply@nutrifit.local',
      to: 'socio@test.com',
      subject: 'Bienvenido',
      html: '<p>Hola</p>',
      text: 'Hola',
    });
  });
});

function crearConfigService(valores: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((clave: string, valorPorDefecto?: unknown) => {
      return valores[clave] ?? valorPorDefecto;
    }),
  } as unknown as ConfigService;
}
