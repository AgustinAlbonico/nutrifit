/**
 * Tests del componente `SelectorNutricionista`:
 *  - renderiza el select con los nutricionistas activos
 *  - muestra estado de carga
 *  - emite onChange al seleccionar un nutricionista
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import React from 'react';

import { server } from '@/mocks/server';
import { SelectorNutricionista } from './SelectorNutricionista';

function renderSelector(props: {
  value: number | null;
  onChange: (id: number) => void;
  disabled?: boolean;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SelectorNutricionista {...props} />
    </QueryClientProvider>,
  );
}

const nutri1 = {
  idPersona: 10,
  nombre: 'Lucia',
  apellido: 'Martinez',
  nombreCompleto: 'Lucia Martinez',
  matricula: 'MN1234',
  especialidad: 'Nutricion Clinica',
};

const nutri2 = {
  idPersona: 11,
  nombre: 'Carlos',
  apellido: 'Suarez',
  nombreCompleto: 'Carlos Suarez',
  matricula: 'MN5678',
  especialidad: 'Nutricion Deportiva',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token',
    rol: 'RECEPCIONISTA',
    permissions: [],
    personaId: 1,
    gimnasioId: 1,
    email: 'test@test.com',
    nombre: 'Test',
    apellido: 'User',
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

beforeEach(() => {
  vi.clearAllMocks();
  server.resetHandlers();
});

describe('SelectorNutricionista', () => {
  it('muestra el estado de carga mientras se obtiene la lista', () => {
    server.use(
      http.get('*/profesional', async () => {
        // nunca resuelve para que veamos el loader
        await new Promise(() => undefined);
        return HttpResponse.json({});
      }),
    );

    renderSelector({ value: null, onChange: vi.fn() });

    expect(
      screen.getByText(/cargando profesionales/i),
    ).toBeInTheDocument();
  });

  it('carga la lista de nutricionistas y permite seleccionar uno', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    server.use(
      http.get('*/profesional', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [nutri1, nutri2],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderSelector({ value: null, onChange });

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /Lucia Martinez/i }),
      ).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByTestId('select-nutricionista'),
      '10',
    );

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('muestra empty state cuando no hay nutricionistas', async () => {
    server.use(
      http.get('*/profesional', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderSelector({ value: null, onChange: vi.fn() });

    await waitFor(() => {
      expect(
        screen.getByText(/no hay profesionales activos/i),
      ).toBeInTheDocument();
    });
  });

  it('respeta el atributo disabled cuando se pasa', async () => {
    server.use(
      http.get('*/profesional', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [nutri1],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderSelector({ value: 10, onChange: vi.fn(), disabled: true });

    const select = await screen.findByTestId('select-nutricionista');
    expect(select).toBeDisabled();
  });
});
