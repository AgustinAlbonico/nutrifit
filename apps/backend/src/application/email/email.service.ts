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

/**
 * Datos para notificar al nutricionista que un tercero (recepcion,
 * admin, o el mismo nutri desde el nuevo endpoint POST /turnos/crear)
 * agendo un turno en su agenda.
 *
 * El `nombreProfesional` es el del nutricionista destinatario; el
 * `nombreSocio` y `dniSocio` permiten identificar al paciente. El
 * `creadoPor` se incluye en el cuerpo del email para que el nutri
 * sepa quien origino la reserva (recepcion/admin/el mismo).
 */
export interface NotificacionTurnoParaNutriData {
  email: string;
  nombreNutricionista: string;
  nombreSocio: string;
  dniSocio?: string | null;
  fecha: string;
  hora: string;
  creadoPor: 'RECEPCION' | 'ADMIN' | 'NUTRICIONISTA';
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

  /**
   * Envia una notificacion por email al nutricionista cuando un
   * tercero agenda un turno en su agenda.
   *
   * Implementa el spec literal `crear-turno-en-nombre-del-socio-endpoint.md`
   * seccion `Eventos` (subseccion `Emails Disparados`, punto 2:
   * "Nutricionista: Recibe notificacion del nuevo turno agendado en
   * su agenda."). La design §11.G decia "no notificar al nutri" como
   * desviacion justificada por consistencia con `AsignarTurnoManual`;
   * el orquestador sobreescribio esa decision a favor del spec
   * literal y por eso este metodo existe.
   *
   * Best-effort: si el provider falla, el error se propaga al caller
   * (no se traga) para que el use-case decida que hacer (en PR-2 se
   * loguea y se continua con la operacion, para no abortar la
   * creacion del turno por un fallo de email).
   */
  async enviarNotificacionTurnoParaNutri(
    data: NotificacionTurnoParaNutriData,
  ): Promise<void> {
    const lugar = this.mapearCreadoPorALugar(data.creadoPor);
    const subject = `Nuevo turno agendado en tu agenda (${lugar})`;
    const html = `
      <p>Hola ${data.nombreNutricionista},</p>
      <p>Se agendo un nuevo turno en tu agenda:</p>
      <ul>
        <li><strong>Paciente:</strong> ${data.nombreSocio}${data.dniSocio ? ` (DNI ${data.dniSocio})` : ''}</li>
        <li><strong>Fecha:</strong> ${data.fecha}</li>
        <li><strong>Hora:</strong> ${data.hora}</li>
        <li><strong>Agendado por:</strong> ${lugar}</li>
      </ul>
      <p>Podes ver el detalle en tu agenda del gimnasio.</p>
    `.trim();
    await this.emailProvider.enviar({
      to: data.email,
      subject,
      html,
      gimnasioId: data.gimnasioId,
    });
  }

  private mapearCreadoPorALugar(
    creadoPor: 'RECEPCION' | 'ADMIN' | 'NUTRICIONISTA',
  ): string {
    switch (creadoPor) {
      case 'RECEPCION':
        return 'recepcion';
      case 'ADMIN':
        return 'administracion';
      case 'NUTRICIONISTA':
        return 'el mismo profesional';
      default:
        return 'staff del gimnasio';
    }
  }
}
