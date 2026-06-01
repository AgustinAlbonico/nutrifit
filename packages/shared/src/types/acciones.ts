/**
 * Acciones del sistema para permisos granulares.
 * Estas acciones se insertan via seed y no se administran desde la UI.
 */
export const ACCIONES = {
  // Socios
  SOCIOS_CREAR: 'socios.crear',
  SOCIOS_EDITAR: 'socios.editar',
  SOCIOS_ELIMINAR: 'socios.eliminar',
  SOCIOS_VER: 'socios.ver',

  // Nutricionistas
  NUTRICIONISTAS_CREAR: 'nutricionistas.crear',
  NUTRICIONISTAS_EDITAR: 'nutricionistas.editar',
  NUTRICIONISTAS_ELIMINAR: 'nutricionistas.eliminar',
  NUTRICIONISTAS_VER: 'nutricionistas.ver',

  // Recepcionistas
  RECEPCIONISTAS_CREAR: 'recepcionistas.crear',
  RECEPCIONISTAS_EDITAR: 'recepcionistas.editar',
  RECEPCIONISTAS_ELIMINAR: 'recepcionistas.eliminar',
  RECEPCIONISTAS_VER: 'recepcionistas.ver',

  // Turnos
  TURNOS_CREAR: 'turnos.crear',
  TURNOS_EDITAR: 'turnos.editar',
  TURNOS_CANCELAR: 'turnos.cancelar',
  TURNOS_VER: 'turnos.ver',
  TURNOS_RESERVAR: 'turnos.reservar',

  // Fichas
  FICHAS_VER: 'fichas.ver',
  FICHAS_EDITAR: 'fichas.editar',
  MI_FICHA_VER: 'mi-ficha.ver',

  // Planes
  PLANES_CREAR: 'planes.crear',
  PLANES_EDITAR: 'planes.editar',
  PLANES_VER: 'planes.ver',
  MIS_PLANES_VER: 'mis-planes.ver',

  // Pacientes
  PACIENTES_VER: 'pacientes.ver',

  // Reportes
  REPORTES_GENERAR: 'reportes.generar',
  REPORTES_VER: 'reportes.ver',

  // Gimnasios (solo SUPERADMIN)
  GIMNASIOS_CREAR: 'gimnasios.crear',
  GIMNASIOS_EDITAR: 'gimnasios.editar',
  GIMNASIOS_ELIMINAR: 'gimnasios.eliminar',
  GIMNASIOS_VER: 'gimnasios.ver',
  GIMNASIOS_IMPERSONAR: 'gimnasios.impersonar',
} as const;

export type Accion = (typeof ACCIONES)[keyof typeof ACCIONES];

/**
 * Todas las acciones como array, útil para seeding.
 */
export const TODAS_LAS_ACCIONES = Object.values(ACCIONES);