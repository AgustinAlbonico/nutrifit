import { ACCIONES, TODAS_LAS_ACCIONES } from '@nutrifit/shared';

export interface GrupoPermisoData {
  clave: string;
  nombre: string;
  descripcion: string;
  acciones: string[];
}

/**
 * Grupos de permisos base para el sistema.
 * Se crean via seed y no se modifican desde la UI.
 */
export const GRUPOS_PERMISOS: Record<string, GrupoPermisoData> = {
  ADMIN: {
    clave: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Acceso total dentro del tenant',
    acciones: Object.values(ACCIONES), // wildcard - todas las acciones
  },
  RECEPCIONISTA: {
    clave: 'RECEPCIONISTA',
    nombre: 'Recepcionista',
    descripcion: 'Gestion de socios, nutricionistas y turnos',
    acciones: [
      'socios.*', // todas las acciones de socios
      ACCIONES.NUTRICIONISTAS_CREAR,
      ACCIONES.NUTRICIONISTAS_EDITAR,
      ACCIONES.NUTRICIONISTAS_VER,
      'turnos.*', // todas las acciones de turnos
      ACCIONES.RECEPCIONISTAS_VER,
    ],
  },
  NUTRICIONISTA: {
    clave: 'NUTRICIONISTA',
    nombre: 'Nutricionista',
    descripcion: 'Gestión de pacientes y planes',
    acciones: [
      ACCIONES.PACIENTES_VER,
      ACCIONES.FICHAS_VER,
      ACCIONES.FICHAS_EDITAR,
      ACCIONES.PLANES_CREAR,
      ACCIONES.PLANES_EDITAR,
      ACCIONES.PLANES_VER,
      ACCIONES.TURNOS_VER,
    ],
  },
  SOCIO: {
    clave: 'SOCIO',
    nombre: 'Socio',
    descripcion: 'Acceso a funcionalidades propias',
    acciones: [
      ACCIONES.TURNOS_RESERVAR,
      ACCIONES.MI_FICHA_VER,
      ACCIONES.MIS_PLANES_VER,
      ACCIONES.TURNOS_VER,
    ],
  },
};

export const GRUPOS_PERMISOS_ARRAY = Object.values(GRUPOS_PERMISOS);

/**
 * Obtiene el grupo de permisos base para un rol.
 */
export function getGrupoBasePorRol(rol: string): GrupoPermisoData | undefined {
  const mapping: Record<string, string> = {
    SUPERADMIN: 'ADMIN',
    ADMIN: 'ADMIN',
    RECEPCIONISTA: 'RECEPCIONISTA',
    NUTRICIONISTA: 'NUTRICIONISTA',
    SOCIO: 'SOCIO',
  };
  const clave = mapping[rol];
  return clave ? GRUPOS_PERMISOS[clave] : undefined;
}

export { TODAS_LAS_ACCIONES };
