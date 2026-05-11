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
});
