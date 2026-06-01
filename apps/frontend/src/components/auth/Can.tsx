import { type ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface CanProps {
  /**
   * Una única acción a verificar (ej: 'socios.crear')
   */
  accion?: string;

  /**
   * Array de acciones a verificar
   */
  acciones?: string[];

  /**
   * Cuando es true, verifica si el usuario tiene AL MENOS UNA acción.
   * Cuando es false (default), verifica si el usuario tiene TODAS las acciones.
   * Solo aplica cuando se usa el prop `acciones`.
   */
  algunaDe?: boolean;

  /**
   * Contenido a renderizar si el usuario tiene los permisos requeridos.
   */
  children: ReactNode;

  /**
   * Contenido a renderizar si el usuario NO tiene los permisos requeridos.
   * Por defecto es null (no se renderiza nada).
   */
  fallback?: ReactNode;
}

/**
 * Componente que renderiza children solo si el usuario tiene los permisos necesarios.
 * Se usa para ocultar/mostrar elementos de UI según permisos del usuario.
 *
 * @example
 * // Con una sola acción
 * <Can accion="socios.editar">
 *   <Button>Editar socio</Button>
 * </Can>
 *
 * @example
 * // Con array de acciones (alguna de ellas)
 * <Can acciones={['reportes.ver', 'reportes.generar']} algunaDe>
 *   <Button>Ver reportes</Button>
 * </Can>
 *
 * @example
 * // Con fallback
 * <Can accion="socios.eliminar" fallback={<Button disabled>Eliminar</Button>}>
 *   <Button onClick={handleDelete}>Eliminar</Button>
 * </Can>
 */
export function Can({
  accion,
  acciones,
  algunaDe = false,
  children,
  fallback = null,
}: CanProps) {
  const { tieneAccion, tieneAlgunaAccion, tieneTodasLasAcciones } = usePermissions();

  let tienePermiso = false;

  if (accion !== undefined) {
    tienePermiso = tieneAccion(accion);
  } else if (acciones !== undefined) {
    tienePermiso = algunaDe
      ? tieneAlgunaAccion(acciones)
      : tieneTodasLasAcciones(acciones);
  }

  return <>{tienePermiso ? children : fallback}</>;
}