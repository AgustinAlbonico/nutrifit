import { Inject, Injectable } from '@nestjs/common';
import { TipoRecordatorio } from 'src/infrastructure/persistence/typeorm/entities/recordatorio-enviado.entity';
import { IEmailProvider } from './contracts/email-provider.interface';

export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

interface TurnoEmailData {
  email: string;
  nombreSocio: string;
  nombreProfesional: string;
  fecha: string;
  hora: string;
  enlaceConfirmacion: string;
  enlaceCancelacion: string;
  gimnasioId?: number;
}

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
  ) {}

  async enviarRecordatorio(
    turno: TurnoEmailData,
    tipo: TipoRecordatorio,
  ): Promise<void> {
    const asunto =
      tipo === TipoRecordatorio.REMINDER_24H
        ? 'Recordatorio de turno (24h)'
        : 'Recordatorio de turno (48h)';
    const html = `<p>Hola ${turno.nombreSocio}, recordatorio de tu turno con ${turno.nombreProfesional} el ${turno.fecha} a las ${turno.hora}.</p><p><a href="${turno.enlaceConfirmacion}">Confirmar</a> | <a href="${turno.enlaceCancelacion}">Cancelar</a></p>`;
    await this.emailProvider.enviar({
      to: turno.email,
      subject: asunto,
      html,
      gimnasioId: turno.gimnasioId,
    });
  }
}
