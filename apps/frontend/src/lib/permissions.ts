/**
 * Verifica si un permiso concreto (ej. 'socios.ver') coincide con un permiso
 * del usuario que puede contener wildcards (ej. 'socios.*').
 *
 * Reglas:
 * - Si el permiso del usuario termina en '.*', matchea cualquier acción que
 *   comience con el mismo prefijo (ej. 'socios.*' matchea 'socios.crear').
 * - Si no tiene wildcard, hace match exacto.
 */
export function coincidePermiso(
  accion: string,
  permisoUsuario: string,
): boolean {
  if (permisoUsuario.endsWith('.*')) {
    const prefijo = permisoUsuario.slice(0, -1);
    return accion.startsWith(prefijo);
  }
  return accion === permisoUsuario;
}

/**
 * Verifica si al menos uno de los permisos del usuario coincide
 * con la acción solicitada (soporta wildcards).
 */
export function tienePermiso(accion: string, permisos: string[]): boolean {
  return permisos.some((p) => coincidePermiso(accion, p));
}

/**
 * Verifica si el usuario tiene TODAS las acciones solicitadas.
 */
export function tieneTodosLosPermisos(
  acciones: string[],
  permisos: string[],
): boolean {
  return acciones.every((accion) => tienePermiso(accion, permisos));
}
