export enum TipoNotificacion {
  TURNO_RESERVADO = 'TURNO_RESERVADO',
  TURNO_CANCELADO = 'TURNO_CANCELADO',
  TURNO_REPROGRAMADO = 'TURNO_REPROGRAMADO',
  CHECK_IN = 'CHECK_IN',
  TURNO_AUSENTE = 'TURNO_AUSENTE', // Agrego este también por paridad con el backend
  TURNO_AUSENTE_AUTO = 'TURNO_AUSENTE_AUTO',
  TURNO_AVISO_LLEGADA_TARDE = 'TURNO_AVISO_LLEGADA_TARDE',
  TURNO_INASISTENCIA_AVISO = 'TURNO_INASISTENCIA_AVISO',
  PLAN_CREADO = 'PLAN_CREADO',
  PLAN_EDITADO = 'PLAN_EDITADO',
  PLAN_ELIMINADO = 'PLAN_ELIMINADO',
  CONSULTA_FINALIZADA = 'CONSULTA_FINALIZADA',
}

export enum EstadoNotificacion {
  NO_LEIDA = 'NO_LEIDA',
  LEIDA = 'LEIDA',
}

export interface NotificacionMetaData {
  turnoId?: number;
  planId?: number;
  consultaId?: number;
  rutaNavegacion?: string;
  [clave: string]: unknown;
}
