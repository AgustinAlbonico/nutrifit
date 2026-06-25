/**
 * Acciones del sistema para permisos granulares.
 * Estas acciones se insertan via seed y no se administran desde la UI.
 */

/**
 * Descripcion de una accion individual.
 */
export interface AccionDescripcion {
  codigo: string;
  descripcion: string;
  categoria: string;
}

/**
 * Todas las acciones con sus descripciones para la UI.
 */
export const ACCIONES_METADATA: Record<string, AccionDescripcion> = {
  // Socios
  'socios.crear': {
    codigo: 'socios.crear',
    descripcion: 'Permite crear nuevos socios en el gimnasio',
    categoria: 'Socios',
  },
  'socios.editar': {
    codigo: 'socios.editar',
    descripcion: 'Permite modificar datos de socios existentes',
    categoria: 'Socios',
  },
  'socios.eliminar': {
    codigo: 'socios.eliminar',
    descripcion: 'Permite eliminar socios del sistema',
    categoria: 'Socios',
  },
  'socios.ver': {
    codigo: 'socios.ver',
    descripcion: 'Permite ver la lista y detalles de socios',
    categoria: 'Socios',
  },

  // Nutricionistas
  'nutricionistas.crear': {
    codigo: 'nutricionistas.crear',
    descripcion: 'Permite registrar nuevos nutricionistas',
    categoria: 'Nutricionistas',
  },
  'nutricionistas.editar': {
    codigo: 'nutricionistas.editar',
    descripcion: 'Permite modificar datos de nutricionistas',
    categoria: 'Nutricionistas',
  },
  'nutricionistas.eliminar': {
    codigo: 'nutricionistas.eliminar',
    descripcion: 'Permite eliminar nutricionistas del sistema',
    categoria: 'Nutricionistas',
  },
  'nutricionistas.ver': {
    codigo: 'nutricionistas.ver',
    descripcion: 'Permite ver la lista y detalles de nutricionistas',
    categoria: 'Nutricionistas',
  },

  // Recepcionistas
  'recepcionistas.crear': {
    codigo: 'recepcionistas.crear',
    descripcion: 'Permite registrar nuevos recepcionistas',
    categoria: 'Recepcionistas',
  },
  'recepcionistas.editar': {
    codigo: 'recepcionistas.editar',
    descripcion: 'Permite modificar datos de recepcionistas',
    categoria: 'Recepcionistas',
  },
  'recepcionistas.eliminar': {
    codigo: 'recepcionistas.eliminar',
    descripcion: 'Permite eliminar recepcionistas del sistema',
    categoria: 'Recepcionistas',
  },
  'recepcionistas.ver': {
    codigo: 'recepcionistas.ver',
    descripcion: 'Permite ver la lista y detalles de recepcionistas',
    categoria: 'Recepcionistas',
  },

  // Turnos
  'turnos.crear': {
    codigo: 'turnos.crear',
    descripcion: 'Permite crear nuevos turnos en la agenda',
    categoria: 'Turnos',
  },
  'turnos.editar': {
    codigo: 'turnos.editar',
    descripcion: 'Permite modificar turnos existentes',
    categoria: 'Turnos',
  },
  'turnos.cancelar': {
    codigo: 'turnos.cancelar',
    descripcion: 'Permite cancelar turnos programados',
    categoria: 'Turnos',
  },
  'turnos.ver': {
    codigo: 'turnos.ver',
    descripcion: 'Permite ver la lista y detalles de turnos',
    categoria: 'Turnos',
  },
  'turnos.reservar': {
    codigo: 'turnos.reservar',
    descripcion: 'Permite a socios reservar turnos disponibles',
    categoria: 'Turnos',
  },

  // Fichas
  'fichas.ver': {
    codigo: 'fichas.ver',
    descripcion: 'Permite ver fichas clinicas de pacientes',
    categoria: 'Fichas',
  },
  'fichas.editar': {
    codigo: 'fichas.editar',
    descripcion: 'Permite editar contenido de fichas clinicas',
    categoria: 'Fichas',
  },
  'mi-ficha.ver': {
    codigo: 'mi-ficha.ver',
    descripcion: 'Permite al socio ver su propia ficha clinica',
    categoria: 'Fichas',
  },

  // Planes
  'planes.crear': {
    codigo: 'planes.crear',
    descripcion: 'Permite crear planes alimentarios',
    categoria: 'Planes',
  },
  'planes.editar': {
    codigo: 'planes.editar',
    descripcion: 'Permite modificar planes alimentarios existentes',
    categoria: 'Planes',
  },
  'planes.ver': {
    codigo: 'planes.ver',
    descripcion: 'Permite ver planes alimentarios',
    categoria: 'Planes',
  },
  'mis-planes.ver': {
    codigo: 'mis-planes.ver',
    descripcion: 'Permite al socio ver sus propios planes alimentarios',
    categoria: 'Planes',
  },
  'planes-ia.generar': {
    codigo: 'planes-ia.generar',
    descripcion: 'Permite generar planes semanales con asistencia de IA',
    categoria: 'Planes IA',
  },
  'planes-ia.regenerar': {
    codigo: 'planes-ia.regenerar',
    descripcion: 'Permite regenerar un plan o parte del mismo con IA',
    categoria: 'Planes IA',
  },
  'planes-ia.feedback': {
    codigo: 'planes-ia.feedback',
    descripcion: 'Permite votar y comentar sobre versiones de planes IA',
    categoria: 'Planes IA',
  },
  'planes-ia.memoria.editar': {
    codigo: 'planes-ia.memoria.editar',
    descripcion:
      'Permite editar las preferencias persistentes y la memoria IA del nutricionista',
    categoria: 'Planes IA',
  },
  'planes.activar': {
    codigo: 'planes.activar',
    descripcion: 'Permite activar una version de un plan alimentario',
    categoria: 'Planes',
  },
  'planes.finalizar': {
    codigo: 'planes.finalizar',
    descripcion: 'Permite finalizar un plan alimentario activo',
    categoria: 'Planes',
  },

  // Pacientes
  'pacientes.ver': {
    codigo: 'pacientes.ver',
    descripcion: 'Permite ver la lista de pacientes asignados',
    categoria: 'Pacientes',
  },

  // Reportes
  'reportes.generar': {
    codigo: 'reportes.generar',
    descripcion: 'Permite generar nuevos reportes del sistema',
    categoria: 'Reportes',
  },
  'reportes.ver': {
    codigo: 'reportes.ver',
    descripcion: 'Permite ver reportes generados',
    categoria: 'Reportes',
  },

  // Gimnasios (solo SUPERADMIN)
  'gimnasios.crear': {
    codigo: 'gimnasios.crear',
    descripcion: 'Permite crear nuevos gimnasios en el sistema',
    categoria: 'Gimnasios',
  },
  'gimnasios.editar': {
    codigo: 'gimnasios.editar',
    descripcion: 'Permite modificar datos de gimnasios',
    categoria: 'Gimnasios',
  },
  'gimnasios.eliminar': {
    codigo: 'gimnasios.eliminar',
    descripcion: 'Permite eliminar gimnasios del sistema',
    categoria: 'Gimnasios',
  },
  'gimnasios.ver': {
    codigo: 'gimnasios.ver',
    descripcion: 'Permite ver la lista y detalles de gimnasios',
    categoria: 'Gimnasios',
  },
  'gimnasios.impersonar': {
    codigo: 'gimnasios.impersonar',
    descripcion: 'Permite impersonar a un gimnasio para tareas de administracion',
    categoria: 'Gimnasios',
  },
};

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
  PLANES_IA_GENERAR: 'planes-ia.generar',
  PLANES_IA_REGENERAR: 'planes-ia.regenerar',
  PLANES_IA_FEEDBACK: 'planes-ia.feedback',
  PLANES_IA_MEMORIA_EDITAR: 'planes-ia.memoria.editar',
  PLANES_ACTIVAR: 'planes.activar',
  PLANES_FINALIZAR: 'planes.finalizar',

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
 * Todas las acciones como array, util para seeding.
 */
export const TODAS_LAS_ACCIONES = Object.values(ACCIONES);

/**
 * Obtiene las categorias unicas de todas las acciones.
 */
export function getCategoriasAcciones(): string[] {
  const categorias = new Set<string>();
  for (const meta of Object.values(ACCIONES_METADATA)) {
    categorias.add(meta.categoria);
  }
  return Array.from(categorias).sort();
}

/**
 * Agrupa acciones por categoria para la UI.
 */
export function getAccionesPorCategoria(): Record<string, string[]> {
  const grupos: Record<string, string[]> = {};
  for (const meta of Object.values(ACCIONES_METADATA)) {
    const categoria = meta.categoria;
    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }
    grupos[categoria]!.push(meta.codigo);
  }
  return grupos;
}