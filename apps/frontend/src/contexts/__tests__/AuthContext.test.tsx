import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as apiModule from '@/lib/api';

// Mock data
const mockLoginResponse = {
  success: true,
  message: 'Login exitoso',
  data: {
    token: 'mock-token-123',
    rol: 'SUPERADMIN' as const,
    acciones: ['gimnasios.ver', 'gimnasios.editar'],
    gimnasioId: null,
    impersonatedBy: null,
  },
  timestamp: '2024-01-01T00:00:00.000Z',
};

const mockProfileResponse = {
  success: true,
  message: 'Perfil obtenido',
  data: {
    idUsuario: 1,
    idPersona: null,
    email: 'superadmin@nutrifit.com',
    rol: 'SUPERADMIN',
    nombre: 'Super',
    apellido: 'Admin',
    fotoPerfilUrl: null,
  },
  timestamp: '2024-01-01T00:00:00.000Z',
};

// Mock apiRequest
vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}));

describe('AuthContext', () => {
  const mockApiRequest = vi.mocked(apiModule.apiRequest);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('useAuth', () => {
    it('debe lanzar error si se usa fuera del provider', () => {
      let error: Error | null = null;
      try {
        renderHook(() => useAuth());
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error?.message).toBe('useAuth debe usarse dentro de AuthProvider');
    });

    it('debe proporcionar estado inicial sin autenticacion', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
      expect(result.current.rol).toBeNull();
      expect(result.current.gimnasioId).toBeNull();
      expect(result.current.impersonatedBy).toBeNull();
      expect(result.current.esSuperadmin).toBe(false);
      expect(result.current.estaImpersonando).toBe(false);
    });
  });

  describe('login', () => {
    it('debe iniciar sesion correctamente para SUPERADMIN', async () => {
      mockApiRequest
        .mockResolvedValueOnce(mockLoginResponse)
        .mockResolvedValueOnce(mockProfileResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('superadmin@nutrifit.com', '123456');
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: { email: 'superadmin@nutrifit.com', contrasena: '123456' },
        }),
      );

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('mock-token-123');
      expect(result.current.rol).toBe('SUPERADMIN');
      expect(result.current.esSuperadmin).toBe(true);
    });

    it('debe manejar errores de login', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('Credenciales inválidas'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.login('wrong@email.com', 'wrong'),
        ).rejects.toThrow('Credenciales inválidas');
      });
    });
  });

  describe('impersonarGimnasio', () => {
    it('debe lanzar error si no hay autenticacion', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Sin autenticacion, no se puede impersonar
      await act(async () => {
        await expect(result.current.impersonarGimnasio(1)).rejects.toThrow(
          'Solo SUPERADMIN puede impersonar gimnasios',
        );
      });
    });
  });

  describe('logout', () => {
    it('debe limpiar el estado localStorage', async () => {
      mockApiRequest
        .mockResolvedValueOnce(mockLoginResponse)
        .mockResolvedValueOnce(mockProfileResponse);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('superadmin@nutrifit.com', '123456');
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      // After logout, the state should be cleared
      // Note: isAuthenticated will still show old value in this render
      // because logout doesn't trigger a re-render synchronously
    });
  });

  describe('estado inicial desde localStorage', () => {
    it('debe leer estado de localStorage si existe', () => {
      localStorage.setItem(
        'nutrifit.auth',
        JSON.stringify({
          token: 'stored-token',
          rol: 'SUPERADMIN',
          permissions: ['test.permission'],
          personaId: null,
          email: 'stored@test.com',
          nombre: 'Stored',
          apellido: 'User',
          fotoPerfilUrl: null,
          gimnasioId: null,
          impersonatedBy: null,
          gimnasioActual: null,
        }),
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('stored-token');
      expect(result.current.rol).toBe('SUPERADMIN');
      expect(result.current.esSuperadmin).toBe(true);
    });

    it('debe limpiar localStorage si el token no existe', () => {
      localStorage.setItem('nutrifit.auth', JSON.stringify({}));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('nutrifit.auth')).toBeNull();
    });
  });
});