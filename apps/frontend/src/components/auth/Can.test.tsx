import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Can } from './Can';
import { usePermissions } from '@/hooks/usePermissions';

vi.mock('@/hooks/usePermissions');

const mockUsePermissions = usePermissions as ReturnType<typeof vi.fn>;

describe('Can', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('con una sola accion', () => {
    it('debe renderizar children cuando el usuario tiene la accion', () => {
      mockUsePermissions.mockReturnValue({
        tieneAccion: (accion: string) => accion === 'socios.editar',
        tieneAlgunaAccion: () => false,
        tieneTodasLasAcciones: () => false,
        esSuperadmin: false,
        esAdmin: false,
      });

      render(
        <Can accion="socios.editar">
          <button>Editar</button>
        </Can>,
      );

      expect(document.body.querySelector('button')).toBeInTheDocument();
    });

    it('debe renderizar fallback cuando el usuario NO tiene la accion', () => {
      mockUsePermissions.mockReturnValue({
        tieneAccion: () => false,
        tieneAlgunaAccion: () => false,
        tieneTodasLasAcciones: () => false,
        esSuperadmin: false,
        esAdmin: false,
      });

      render(
        <Can accion="socios.eliminar" fallback={<button disabled>No disponible</button>}>
          <button>Eliminar</button>
        </Can>,
      );

      expect(document.body.querySelector('button[disabled]')).toBeInTheDocument();
    });

    it('debe renderizar null por defecto cuando no hay fallback y el usuario no tiene la accion', () => {
      mockUsePermissions.mockReturnValue({
        tieneAccion: () => false,
        tieneAlgunaAccion: () => false,
        tieneTodasLasAcciones: () => false,
        esSuperadmin: false,
        esAdmin: false,
      });

      const { container } = render(
        <Can accion="socios.eliminar">
          <button>Eliminar</button>
        </Can>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('con array de acciones y algunaDe=true', () => {
    it('debe renderizar children cuando el usuario tiene al menos una accion del array', () => {
      mockUsePermissions.mockReturnValue({
        tieneAccion: () => false,
        tieneAlgunaAccion: (acciones: string[]) => acciones.includes('reportes.ver'),
        tieneTodasLasAcciones: () => false,
        esSuperadmin: false,
        esAdmin: false,
      });

      render(
        <Can acciones={['reportes.ver', 'reportes.generar']} algunaDe>
          <button>Ver reportes</button>
        </Can>,
      );

      expect(document.body.querySelector('button')).toBeInTheDocument();
    });

    it('debe renderizar fallback cuando el usuario no tiene ninguna accion del array', () => {
      mockUsePermissions.mockReturnValue({
        tieneAccion: () => false,
        tieneAlgunaAccion: () => false,
        tieneTodasLasAcciones: () => false,
        esSuperadmin: false,
        esAdmin: false,
      });

      render(
        <Can acciones={['reportes.ver', 'reportes.generar']} algunaDe fallback={<span>Sin acceso</span>}>
          <button>Ver reportes</button>
        </Can>,
      );

      expect(document.body.querySelector('span')).toBeInTheDocument();
    });
  });

  describe('con array de acciones y algunaDe=false (default)', () => {
    it('debe renderizar children cuando el usuario tiene todas las acciones del array', () => {
      mockUsePermissions.mockReturnValue({
        tieneAccion: () => false,
        tieneAlgunaAccion: () => false,
        tieneTodasLasAcciones: (acciones: string[]) =>
          acciones.every((a) => ['socios.ver', 'socios.editar'].includes(a)),
        esSuperadmin: false,
        esAdmin: false,
      });

      render(
        <Can acciones={['socios.ver', 'socios.editar']}>
          <button>Gestionar socios</button>
        </Can>,
      );

      expect(document.body.querySelector('button')).toBeInTheDocument();
    });

    it('debe renderizar fallback cuando al usuario le falta alguna accion del array', () => {
      mockUsePermissions.mockReturnValue({
        tieneAccion: () => false,
        tieneAlgunaAccion: () => false,
        tieneTodasLasAcciones: () => false,
        esSuperadmin: false,
        esAdmin: false,
      });

      render(
        <Can acciones={['socios.ver', 'socios.editar', 'socios.eliminar']} fallback={<span>Sin permisos completos</span>}>
          <button>Gestionar socios</button>
        </Can>,
      );

      expect(document.body.querySelector('span')).toBeInTheDocument();
    });
  });
});