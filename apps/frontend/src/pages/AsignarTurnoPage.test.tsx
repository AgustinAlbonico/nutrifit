/**
 * Tests de la pagina `AsignarTurnoPage`:
 *  - Muestra card "Acceso denegado" para SOCIO.
 *  - Muestra el wizard completo para RECEPCIONISTA.
 *  - Muestra el wizard (con selector de nutri oculto) para NUTRICIONISTA.
 *  - Muestra el wizard para ADMIN.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import React from 'react';

import { server } from '@/mocks/server';
import { AsignarTurnoPage } from './AsignarTurnoPage';
import type { Rol } from '@nutrifit/shared';

interface AuthState {
  token: string | null;
  rol: Rol | null;
  personaId: number | null;
}

const authState: AuthState = {
  token: 'test-token',
  rol: 'RECEPCIONISTA',
  personaId: 1,
};

const navegarMock = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: authState.token,
    rol: authState.rol,
    permissions: [],
    personaId: authState.personaId,
    gimnasioId: 1,
    email: 'recep@test.com',
    nombre: 'Recep',
    apellido: 'Test',
    fotoPerfilUrl: null,
    isAuthenticated: true,
    esSuperadmin: false,
    estaImpersonando: false,
    login: vi.fn(),
    logout: vi.fn(),
    impersonarGimnasio: vi.fn(),
    salirDeImpersonacion: vi.fn(),
    cargarGimnasios: vi.fn(),
    refreshPermissions: vi.fn(),
    hasPermission: () => true,
    hasAllPermissions: () => true,
    gimnasioActual: null,
    listaGimnasios: [],
    impersonatedBy: null,
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navegarMock,
  Link: ({
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: React.ReactNode;
  }) => <a {...rest}>{children}</a>,
}));

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver =
    ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AsignarTurnoPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  server.resetHandlers();
  authState.rol = 'RECEPCIONISTA';
  authState.personaId = 1;
  // Silenciar toasts (no queremos output en consola durante tests)
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('AsignarTurnoPage', () => {
  it('renderiza card "Acceso denegado" para SOCIO', () => {
    authState.rol = 'SOCIO';
    renderPage();

    expect(screen.getByTestId('acceso-denegado-socio')).toBeInTheDocument();
    expect(screen.getByText(/Acceso denegado/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/1\) buscar socio/i),
    ).not.toBeInTheDocument();
  });

  it('renderiza el wizard completo para RECEPCIONISTA', () => {
    authState.rol = 'RECEPCIONISTA';
    renderPage();

    expect(screen.getByText(/asignar turno a un socio/i)).toBeInTheDocument();
    expect(screen.getByText(/1\) buscar socio/i)).toBeInTheDocument();
  });

  it('renderiza el wizard con el selector de nutri oculto para NUTRICIONISTA', async () => {
    const user = userEvent.setup();
    authState.rol = 'NUTRICIONISTA';
    authState.personaId = 99;

    server.use(
      http.get('*/socio/buscar-con-ficha', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [
            {
              idPersona: 1,
              nombre: 'Ana',
              apellido: 'Gomez',
              dni: '40123456',
              tieneFichaSalud: true,
              nombreCompleto: 'Ana Gomez',
            },
          ],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderPage();

    await user.type(screen.getByTestId('input-buscar-socio'), 'Ana');
    const item = await screen.findByTestId('socio-item-1');
    await user.click(item);

    await waitFor(() => {
      expect(
        screen.getByTestId('nutri-autoseleccionado'),
      ).toBeInTheDocument();
    });
  });

  it('renderiza el wizard para ADMIN', () => {
    authState.rol = 'ADMIN';
    renderPage();

    expect(screen.getByText(/asignar turno a un socio/i)).toBeInTheDocument();
  });
});
