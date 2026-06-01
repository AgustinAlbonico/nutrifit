import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ImpersonationIndicator } from '@/components/admin/ImpersonationIndicator';
import { AuthProvider } from '@/contexts/AuthContext';

const mockGimnasio = {
  id: 1,
  nombre: 'Gym Central',
  direccion: 'Calle Principal 123',
  telefono: '123456789',
  email: 'contacto@gymcentral.com',
  activo: true,
  fechaCreacion: '2024-01-01T00:00:00.000Z',
};

describe('ImpersonationIndicator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('no debe renderizar si no hay autenticacion', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { container } = render(<ImpersonationIndicator />, { wrapper });

    expect(container.firstChild).toBeNull();
  });

  it('no debe renderizar si no esta impersonando', () => {
    localStorage.setItem(
      'nutrifit.auth',
      JSON.stringify({
        token: 'mock-token',
        rol: 'SUPERADMIN',
        permissions: [],
        personaId: null,
        email: 'superadmin@nutrifit.com',
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

    const { container } = render(<ImpersonationIndicator />, { wrapper });

    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar cuando esta impersonando', () => {
    localStorage.setItem(
      'nutrifit.auth',
      JSON.stringify({
        token: 'mock-token',
        rol: 'SUPERADMIN',
        permissions: [],
        personaId: 1,
        email: 'superadmin@nutrifit.com',
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

    const { getByText } = render(<ImpersonationIndicator />, { wrapper });

    expect(getByText('Modo Impersonación')).toBeTruthy();
    expect(getByText('Gym Central')).toBeTruthy();
    expect(getByText('Salir')).toBeTruthy();
  });
});