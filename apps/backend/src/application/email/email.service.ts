import { Inject, Injectable } from '@nestjs/common';
import { TipoRecordatorio } from 'src/infrastructure/persistence/typeorm/entities/recordatorio-enviado.entity';
import { CreadoPor } from 'src/domain/entities/Turno/creado-por.enum';
import { IEmailProvider } from './contracts/email-provider.interface';
import {
  recordatorioTemplate,
  type RecordatorioTemplateData,
} from './templates/recordatorio.template';
import {
  nuevoTurnoNutriTemplate,
  type NuevoTurnoNutriTemplateData,
} from './templates/nuevo-turno-nutri.template';
import {
  bienvenidaTemplate,
  type BienvenidaTemplateData,
} from './templates/bienvenida.template';

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

export interface NotificacionTurnoParaNutriData {
  email: string;
  nombreNutricionista: string;
  nombreSocio: string;
  dniSocio?: string | null;
  fecha: string;
  hora: string;
  creadoPor: CreadoPor;
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
    const data: RecordatorioTemplateData = {
      nombreSocio: turno.nombreSocio,
      nombreProfesional: turno.nombreProfesional,
      fecha: turno.fecha,
      hora: turno.hora,
      enlaceConfirmacion: turno.enlaceConfirmacion,
      enlaceCancelacion: turno.enlaceCancelacion,
    };
    await this.emailProvider.enviar({
      to: turno.email,
      subject: asunto,
      html: recordatorioTemplate(data),
      gimnasioId: turno.gimnasioId,
    });
  }

  async enviarBienvenida(data: BienvenidaTemplateData): Promise<void> {
    await this.emailProvider.enviar({
      to: data.email,
      subject: 'Bienvenido a NutriFit Supervisor',
      html: bienvenidaTemplate({
        ...data,
        loginUrl: this.construirUrlFrontend('/login'),
      }),
    });
  }

  async enviarNotificacionTurnoParaNutri(
    data: NotificacionTurnoParaNutriData,
  ): Promise<void> {
    const subject = 'Nuevo turno agendado en tu agenda';
    const templateData: NuevoTurnoNutriTemplateData = {
      nombreNutricionista: data.nombreNutricionista,
      nombreSocio: data.nombreSocio,
      dniSocio: data.dniSocio,
      fecha: data.fecha,
      hora: data.hora,
      creadoPor: data.creadoPor,
      agendaUrl: this.construirUrlFrontend('/agenda'),
    };
    await this.emailProvider.enviar({
      to: data.email,
      subject,
      html: nuevoTurnoNutriTemplate(templateData),
      gimnasioId: data.gimnasioId,
    });
  }

  private construirUrlFrontend(path: string): string {
    const baseUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
  }
}
