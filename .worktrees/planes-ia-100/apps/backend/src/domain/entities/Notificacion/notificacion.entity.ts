import { EstadoNotificacion } from './estado-notificacion.enum';
import { TipoNotificacion } from './tipo-notificacion.enum';
import type { NotificacionMetaData } from './notificacion-metadata.interface';

export class NotificacionEntity {
  constructor(
    public readonly id: number,
    public readonly destinatarioId: number,
    public readonly tipo: TipoNotificacion,
    public readonly titulo: string,
    public readonly mensaje: string,
    public estado: EstadoNotificacion,
    public readonly metadata: NotificacionMetaData,
    public leidaEn: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
