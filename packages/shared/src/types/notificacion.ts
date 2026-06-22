export enum TipoNotificacion {
  TURNO_RESERVADO = 'TURNO_RESERVADO',
  TURNO_CONFIRMADO = 'TURNO_CONFIRMADO',
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
  NUTRICIONISTA_DESACTIVADO = 'NUTRICIONISTA_DESACTIVADO',
  SOCIO_DESACTIVADO = 'SOCIO_DESACTIVADO',
  // === Reservados por el spec `crear-turno-en-nombre-del-socio-endpoint.md` ===
  // Mantener paridad con el enum del backend. Ver nota en
  // `apps/backend/src/domain/entities/Notificacion/tipo-notificacion.enum.ts`.
  TURNO_CREADO_POR_RECEPCION = 'TURNO_CREADO_POR_RECEPCION',
  TURNO_CREADO_POR_ADMIN = 'TURNO_CREADO_POR_ADMIN',
  TURNO_CREADO_POR_NUTRICIONISTA = 'TURNO_CREADO_POR_NUTRICIONISTA',
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
