import type { EstadoNotificacion, NotificacionMetaData, TipoNotificacion } from '@nutrifit/shared';

export interface Notificacion {
  idNotificacion: number;
  destinatarioId: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  estado: EstadoNotificacion;
  metadata: NotificacionMetaData | null;
  leidaEn: string | null;
  createdAt: string;
}

export interface RespuestaPaginadaNotificaciones {
  data: Notificacion[];
  total: number;
}
