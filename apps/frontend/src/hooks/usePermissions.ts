import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { permissions, rol } = useAuth();

  return useMemo(
    () => ({
      /**
       * Verifica si el usuario tiene una acción específica.
       * @param accion - Código de la acción a verificar (ej: 'socios.crear')
       */
      tieneAccion: (accion: string): boolean => {
        return permissions.includes(accion);
      },

      /**
       * Verifica si el usuario tiene AL MENOS UNA de las acciones especificadas.
       * @param acciones - Array de códigos de acciones a verificar
       */
      tieneAlgunaAccion: (acciones: string[]): boolean => {
        return acciones.some((accion) => permissions.includes(accion));
      },

      /**
       * Verifica si el usuario tiene TODAS las acciones especificadas.
       * @param acciones - Array de códigos de acciones a verificar
       */
      tieneTodasLasAcciones: (acciones: string[]): boolean => {
        return acciones.every((accion) => permissions.includes(accion));
      },

      /**
       * Verifica si el usuario tiene rol SUPERADMIN.
       */
      esSuperadmin: rol === 'SUPERADMIN',

      /**
       * Verifica si el usuario tiene rol ADMIN o SUPERADMIN.
       */
      esAdmin: rol === 'ADMIN' || rol === 'SUPERADMIN',
    }),
    [permissions, rol],
  );
}