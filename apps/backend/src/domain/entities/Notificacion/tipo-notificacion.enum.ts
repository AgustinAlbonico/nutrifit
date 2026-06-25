export enum TipoNotificacion {
  TURNO_RESERVADO = 'TURNO_RESERVADO',
  TURNO_CONFIRMADO = 'TURNO_CONFIRMADO',
  TURNO_CANCELADO = 'TURNO_CANCELADO',
  TURNO_REPROGRAMADO = 'TURNO_REPROGRAMADO',
  CHECK_IN = 'CHECK_IN',
  TURNO_AUSENTE = 'TURNO_AUSENTE',
  TURNO_AUSENTE_AUTO = 'TURNO_AUSENTE_AUTO',
  TURNO_AVISO_LLEGADA_TARDE = 'TURNO_AVISO_LLEGADA_TARDE',
  TURNO_INASISTENCIA_AVISO = 'TURNO_INASISTENCIA_AVISO',
  PLAN_CREADO = 'PLAN_CREADO',
  PLAN_EDITADO = 'PLAN_EDITADO',
  PLAN_ELIMINADO = 'PLAN_ELIMINADO',
  // === Plan IA v2 — máquina de estados (Packet 4) ===
  // PLAN_REVISAR: el nutricionista debe revisar el plan generado por IA.
  // PLAN_ACTIVO: el nutricionista activó una versión del plan.
  // PLAN_FINALIZADO: el plan fue finalizado.
  // PLAN_VALIDACION_WARNING: el plan tiene restricciones no cumplidas tras
  //   agotar los reintentos correctivos.
  // PLAN_MACROS_FUERA_RANGO: el plan tiene macros en banda ROJO (>±10%).
  PLAN_REVISAR = 'PLAN_REVISAR',
  PLAN_ACTIVO = 'PLAN_ACTIVO',
  PLAN_FINALIZADO = 'PLAN_FINALIZADO',
  PLAN_VALIDACION_WARNING = 'PLAN_VALIDACION_WARNING',
  PLAN_MACROS_FUERA_RANGO = 'PLAN_MACROS_FUERA_RANGO',
  CONSULTA_FINALIZADA = 'CONSULTA_FINALIZADA',
  CONSULTA_PREAVISO_CIERRE_AUTO = 'CONSULTA_PREAVISO_CIERRE_AUTO',
  CONSULTA_CERRADA_AUTO = 'CONSULTA_CERRADA_AUTO',
  NUTRICIONISTA_DESACTIVADO = 'NUTRICIONISTA_DESACTIVADO',
  SOCIO_DESACTIVADO = 'SOCIO_DESACTIVADO',
  // === Reservados por el spec `crear-turno-en-nombre-del-socio-endpoint.md` ===
  // Se exponen en el enum por consistencia con el spec y paridad con
  // `packages/shared/src/types/notificacion.ts`, pero el use-case
  // `CrearTurnoEnNombreDeSocioUseCase` emite `TURNO_RESERVADO` con
  // `metadata.creadoPor` (decision documentada en design.md §11.H).
  // Mantenerlos reservados para una iteracion futura que quiera
  // discriminacion fina por rol emisor.
  TURNO_CREADO_POR_RECEPCION = 'TURNO_CREADO_POR_RECEPCION',
  TURNO_CREADO_POR_ADMIN = 'TURNO_CREADO_POR_ADMIN',
  TURNO_CREADO_POR_NUTRICIONISTA = 'TURNO_CREADO_POR_NUTRICIONISTA',
}
