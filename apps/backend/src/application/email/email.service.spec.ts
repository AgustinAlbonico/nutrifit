import { EmailService } from './email.service';
import { TipoRecordatorio } from 'src/infrastructure/persistence/typeorm/entities/recordatorio-enviado.entity';

describe('EmailService', () => {
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
