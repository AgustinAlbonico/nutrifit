/**
 * Tests del componente `BuscadorSocio`:
 *  - renderiza el input vacio y la lista de resultados
 *  - filtra por busqueda de al menos 2 caracteres
 *  - muestra badge verde para socios con ficha completa
 *  - muestra badge ambar para socios sin ficha (RECEPCION/ADMIN)
 *  - bloquea la seleccion de socio sin ficha para NUTRICIONISTA
 *  - permite seleccionar un socio con o sin ficha para RECEPCION/ADMIN
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { BuscadorSocio } from './BuscadorSocio';
import type { SocioConFicha } from '@/types/asignar-turno';

interface RenderProps {
  rolActor: 'RECEPCIONISTA' | 'ADMIN' | 'NUTRICIONISTA' | null;
  socioSeleccionado?: SocioConFicha | null;
  onSeleccionar?: (socio: SocioConFicha) => void;
  onLimpiar?: () => void;
}

function renderBuscador({
  rolActor,
  socioSeleccionado = null,
  onSeleccionar = vi.fn(),
  onLimpiar = vi.fn(),
}: RenderProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BuscadorSocio
        rolActor={rolActor}
        socioSeleccionado={socioSeleccionado}
        onSeleccionar={onSeleccionar}
        onLimpiar={onLimpiar}
      />
    </QueryClientProvider>,
  );
}

const socioConFicha: SocioConFicha = {
  idPersona: 1,
  nombre: 'Ana',
  apellido: 'Gomez',
  dni: '40123456',
  tieneFichaSalud: true,
  nombreCompleto: 'Ana Gomez',
};

const socioSinFicha: SocioConFicha = {
  idPersona: 2,
  nombre: 'Luis',
  apellido: 'Perez',
  dni: '42567890',
  tieneFichaSalud: false,
  nombreCompleto: 'Luis Perez',
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

describe('BuscadorSocio', () => {
  it('muestra el placeholder y el mensaje de minimo 2 caracteres al inicio', () => {
    renderBuscador({ rolActor: 'RECEPCIONISTA' });

    expect(
      screen.getByPlaceholderText(/buscar por nombre, apellido/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/escribí al menos 2 caracteres/i),
    ).toBeInTheDocument();
  });

  it('carga resultados desde el endpoint y muestra badge de ficha completa', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/socio/buscar-con-ficha', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [socioConFicha],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderBuscador({ rolActor: 'RECEPCIONISTA' });

    await user.type(
      screen.getByTestId('input-buscar-socio'),
      'Ana',
    );

    await waitFor(() => {
      expect(screen.getByText('Ana Gomez')).toBeInTheDocument();
    });

    // No debe haber badge de ficha incompleta para socios con ficha
    expect(
      screen.queryByTestId('badge-ficha-advertencia'),
    ).not.toBeInTheDocument();
  });

  it('muestra badge ambar de advertencia para socio sin ficha cuando el rol es RECEPCIONISTA', async () => {
    const user = userEvent.setup();
    const onSeleccionar = vi.fn();
    server.use(
      http.get('*/socio/buscar-con-ficha', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [socioSinFicha],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderBuscador({ rolActor: 'RECEPCIONISTA', onSeleccionar });

    await user.type(
      screen.getByTestId('input-buscar-socio'),
      'Luis',
    );

    await waitFor(() => {
      expect(screen.getByTestId('badge-ficha-advertencia')).toBeInTheDocument();
    });

    // El item debe estar habilitado: click dispara onSeleccionar
    const item = screen.getByTestId('socio-item-2');
    expect(item).not.toBeDisabled();
    await user.click(item);
    expect(onSeleccionar).toHaveBeenCalledWith(socioSinFicha);
  });

  it('bloquea la seleccion de socio sin ficha cuando el rol es NUTRICIONISTA', async () => {
    const user = userEvent.setup();
    const onSeleccionar = vi.fn();
    server.use(
      http.get('*/socio/buscar-con-ficha', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [socioSinFicha],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderBuscador({ rolActor: 'NUTRICIONISTA', onSeleccionar });

    await user.type(
      screen.getByTestId('input-buscar-socio'),
      'Luis',
    );

    await waitFor(() => {
      expect(screen.getByTestId('badge-ficha-bloqueada')).toBeInTheDocument();
    });

    const item = screen.getByTestId('socio-item-2');
    expect(item).toBeDisabled();
    expect(item).toHaveAttribute('aria-disabled', 'true');

    // Click forzado no debe llamar al callback
    await user.click(item).catch(() => undefined);
    expect(onSeleccionar).not.toHaveBeenCalled();
  });

  it('muestra el resumen del socio cuando ya hay uno seleccionado', () => {
    renderBuscador({
      rolActor: 'RECEPCIONISTA',
      socioSeleccionado: socioConFicha,
    });

    expect(screen.getByTestId('socio-seleccionado')).toBeInTheDocument();
    expect(screen.getByText('Ana Gomez')).toBeInTheDocument();
    expect(screen.getByText(/dni: 40123456/i)).toBeInTheDocument();
  });
});
