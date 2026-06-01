import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermissions } from './usePermissions';
import type { Rol } from '@nutrifit/shared';

// Mock useAuth
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tieneAccion', () => {
    it('debe retornar false cuando el usuario no tiene acciones', () => {
      mockUseAuth.mockReturnValue({
        permissions: [] as string[],
        rol: 'SOCIO' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.tieneAccion('socios.crear')).toBe(false);
    });

    it('debe retornar true cuando el usuario tiene la accion', () => {
      mockUseAuth.mockReturnValue({
        permissions: ['socios.crear', 'socios.editar'],
        rol: 'ADMIN' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.tieneAccion('socios.crear')).toBe(true);
      expect(result.current.tieneAccion('socios.editar')).toBe(true);
    });

    it('debe retornar false cuando el usuario no tiene la accion especificada', () => {
      mockUseAuth.mockReturnValue({
        permissions: ['socios.ver'],
        rol: 'SOCIO' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.tieneAccion('socios.eliminar')).toBe(false);
    });
  });

  describe('tieneAlgunaAccion', () => {
    it('debe retornar true cuando el usuario tiene al menos una accion del array', () => {
      mockUseAuth.mockReturnValue({
        permissions: ['socios.crear', 'turnos.ver'],
        rol: 'RECEPCIONISTA' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.tieneAlgunaAccion(['socios.crear', 'socios.editar'])).toBe(true);
    });

    it('debe retornar false cuando el usuario no tiene ninguna de las acciones', () => {
      mockUseAuth.mockReturnValue({
        permissions: ['turnos.ver'],
        rol: 'SOCIO' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.tieneAlgunaAccion(['socios.crear', 'socios.editar'])).toBe(false);
    });
  });

  describe('tieneTodasLasAcciones', () => {
    it('debe retornar true cuando el usuario tiene todas las acciones del array', () => {
      mockUseAuth.mockReturnValue({
        permissions: ['socios.crear', 'socios.editar', 'socios.eliminar'],
        rol: 'ADMIN' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.tieneTodasLasAcciones(['socios.crear', 'socios.editar'])).toBe(true);
    });

    it('debe retornar false cuando al usuario le falta alguna accion del array', () => {
      mockUseAuth.mockReturnValue({
        permissions: ['socios.crear'],
        rol: 'RECEPCIONISTA' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.tieneTodasLasAcciones(['socios.crear', 'socios.editar'])).toBe(false);
    });
  });

  describe('esSuperadmin', () => {
    it('debe retornar true cuando el rol es SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        permissions: [] as string[],
        rol: 'SUPERADMIN' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.esSuperadmin).toBe(true);
    });

    it('debe retornar false cuando el rol no es SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        permissions: [] as string[],
        rol: 'ADMIN' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.esSuperadmin).toBe(false);
    });
  });

  describe('esAdmin', () => {
    it('debe retornar true cuando el rol es ADMIN', () => {
      mockUseAuth.mockReturnValue({
        permissions: [] as string[],
        rol: 'ADMIN' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.esAdmin).toBe(true);
    });

    it('debe retornar true cuando el rol es SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        permissions: [] as string[],
        rol: 'SUPERADMIN' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.esAdmin).toBe(true);
    });

    it('debe retornar false cuando el rol no es ADMIN ni SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        permissions: [] as string[],
        rol: 'SOCIO' as Rol,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.esAdmin).toBe(false);
    });
  });
});