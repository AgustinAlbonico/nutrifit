import { EmailService } from './email.service';
import { TipoRecordatorio } from 'src/infrastructure/persistence/typeorm/entities/recordatorio-enviado.entity';

describe('EmailService', () => {
  it('envía un email genérico usando el provider configurado', async () => {
    const enviar = jest.fn().mockResolvedValue(undefined);
    const service = new EmailService({ enviar });

    await service.enviarEmail({
      para: 'socio@test.com',
      asunto: 'Bienvenido a NutriFit',
      html: '<p>Tu cuenta está lista.</p>',
      texto: 'Tu cuenta está lista.',
      gimnasioId: 7,
    });

    expect(enviar).toHaveBeenCalledWith({
      to: 'socio@test.com',
      subject: 'Bienvenido a NutriFit',
      html: '<p>Tu cuenta está lista.</p>',
      text: 'Tu cuenta está lista.',
      gimnasioId: 7,
    });
  });

  it('omite texto plano cuando no se informa', async () => {
    const enviar = jest.fn().mockResolvedValue(undefined);
    const service = new EmailService({ enviar });

    await service.enviarEmail({
      para: 'socio@test.com',
      asunto: 'Aviso',
      html: '<p>Solo HTML</p>',
    });

    expect(enviar).toHaveBeenCalledWith({
      to: 'socio@test.com',
      subject: 'Aviso',
      html: '<p>Solo HTML</p>',
    });
    const payload = enviar.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(payload, 'text')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(payload, 'gimnasioId')).toBe(
      false,
    );
  });

  it('envía plantilla de recordatorio sin datos clínicos', async () => {
    const enviar = jest.fn().mockResolvedValue(undefined);
    const service = new EmailService({ enviar });
    await service.enviarRecordatorio(
      {
        email: 'socio@test.com',
        nombreSocio: 'Juan',
        nombreProfesional: 'Dra. Ana',
        fecha: '2026-05-10',
        hora: '10:00',
        enlaceConfirmacion: 'http://localhost/ok',
        enlaceCancelacion: 'http://localhost/no',
      },
      TipoRecordatorio.REMINDER_24H,
    );
    expect(enviar).toHaveBeenCalled();
    const payload = enviar.mock.calls[0][0];
    expect(payload.html).not.toContain('patología');
    expect(payload.html).not.toContain('diagnóstico');
  });

  it('envía bienvenida con enlace real de login y datos escapados', async () => {
    const frontendUrlOriginal = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'https://nutrifit.test/';
    const enviar = jest.fn().mockResolvedValue(undefined);
    const service = new EmailService({ enviar });

    try {
      await service.enviarBienvenida({
        nombre: '<Agustín>',
        email: 'agustin@example.com',
        contrasenaProvisional: 'abc<123>',
        rol: 'SOCIO',
      });

      const payload = enviar.mock.calls[0][0];
      expect(payload.html).toContain('https://nutrifit.test/login');
      expect(payload.html).not.toContain('[enlace-login]');
      expect(payload.html).toContain('&lt;Agustín&gt;');
      expect(payload.html).toContain('abc&lt;123&gt;');
    } finally {
      process.env.FRONTEND_URL = frontendUrlOriginal;
    }
  });
});
