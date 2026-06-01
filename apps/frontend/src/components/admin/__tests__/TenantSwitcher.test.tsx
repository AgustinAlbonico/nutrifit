import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { TenantSwitcher } from '@/components/admin/TenantSwitcher';
import { AuthProvider } from '@/contexts/AuthContext';

describe('TenantSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('no debe renderizar si no hay autenticacion', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { container } = render(<TenantSwitcher />, { wrapper });

    // Should not render anything when not authenticated
    expect(container.firstChild).toBeNull();
  });

  it('no debe renderizar si el usuario no es SUPERADMIN', () => {
    // Set up non-SUPERADMIN auth state
    localStorage.setItem(
      'nutrifit.auth',
      JSON.stringify({
        token: 'mock-token',
        rol: 'ADMIN',
        permissions: [],
        personaId: 1,
        email: 'admin@test.com',
        nombre: 'Admin',
        apellido: 'User',
        fotoPerfilUrl: null,
        gimnasioId: 1,
        impersonatedBy: null,
        gimnasioActual: null,
      }),
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { container } = render(<TenantSwitcher />, { wrapper });

    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar para SUPERADMIN', () => {
    // Set up SUPERADMIN auth state
    localStorage.setItem(
      'nutrifit.auth',
      JSON.stringify({
        token: 'mock-token-superadmin',
        rol: 'SUPERADMIN',
        permissions: [],
        personaId: null,
        email: 'superadmin@test.com',
        nombre: 'Super',
        apellido: 'Admin',
        fotoPerfilUrl: null,
        gimnasioId: null,
        impersonatedBy: null,
        gimnasioActual: null,
      }),
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { container } = render(<TenantSwitcher />, { wrapper });

    // Should render something for SUPERADMIN
    expect(container.firstChild).not.toBeNull();
  });

  it('debe renderizar cuando hay gimnasio seleccionado (impersonating)', () => {
    const mockGimnasio = {
      id: 1,
      nombre: 'Gym Central',
      direccion: 'Calle Principal 123',
      activo: true,
      fechaCreacion: '2024-01-01T00:00:00.000Z',
    };

    localStorage.setItem(
      'nutrifit.auth',
      JSON.stringify({
        token: 'mock-token',
        rol: 'SUPERADMIN',
        permissions: [],
        personaId: 1,
        email: 'superadmin@test.com',
        nombre: 'Super',
        apellido: 'Admin',
        fotoPerfilUrl: null,
        gimnasioId: 1,
        impersonatedBy: 1,
        gimnasioActual: mockGimnasio,
      }),
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { getByText } = render(<TenantSwitcher />, { wrapper });

    // Should show the gym name
    expect(getByText('Gym Central')).toBeTruthy();
  });
});