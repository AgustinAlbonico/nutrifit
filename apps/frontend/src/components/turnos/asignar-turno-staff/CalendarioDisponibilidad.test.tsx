/**
 * Tests del componente `CalendarioDisponibilidad`:
 *  - renderiza el grid de slots
 *  - marca como `disabled` los slots OCUPADOS
 *  - emite onSeleccionar al click en un slot libre
 *  - muestra estado de carga y empty state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { CalendarioDisponibilidad } from './CalendarioDisponibilidad';

function renderCalendario(props: {
  nutricionistaId: number | null;
  fecha: Date | undefined;
  slotSeleccionado: { horaInicio: string; horaFin: string } | null;
  onFechaChange: (fecha: Date | undefined) => void;
  onSeleccionar: (slot: { horaInicio: string; horaFin: string }) => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CalendarioDisponibilidad {...props} />
    </QueryClientProvider>,
  );
}

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

describe('CalendarioDisponibilidad', () => {
  it('muestra el mensaje de "selecciona un profesional" cuando no hay nutricionista', () => {
    renderCalendario({
      nutricionistaId: null,
      fecha: new Date('2027-01-15'),
      slotSeleccionado: null,
      onFechaChange: vi.fn(),
      onSeleccionar: vi.fn(),
    });

    expect(
      screen.getByText(/selecciona un profesional/i),
    ).toBeInTheDocument();
  });

  it('carga slots y deshabilita los OCUPADOS', async () => {
    const fecha = new Date('2027-02-01');
    server.use(
      http.get('*/turnos/admin/profesional/1/disponibilidad', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [
            { horaInicio: '09:00', horaFin: '09:30', estado: 'LIBRE' },
            { horaInicio: '10:00', horaFin: '10:30', estado: 'OCUPADO' },
            { horaInicio: '11:00', horaFin: '11:30', estado: 'LIBRE' },
          ],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderCalendario({
      nutricionistaId: 1,
      fecha,
      slotSeleccionado: null,
      onFechaChange: vi.fn(),
      onSeleccionar: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('slot-09:00')).toBeInTheDocument();
    });

    expect(screen.getByTestId('slot-09:00')).not.toBeDisabled();
    expect(screen.getByTestId('slot-10:00')).toBeDisabled();
    expect(screen.getByTestId('slot-10:00')).toHaveAttribute('data-estado', 'OCUPADO');
    expect(screen.getByTestId('slot-11:00')).not.toBeDisabled();
  });

  it('emite onSeleccionar al hacer click en un slot libre', async () => {
    const user = userEvent.setup();
    const onSeleccionar = vi.fn();
    const fecha = new Date('2027-02-01');
    server.use(
      http.get('*/turnos/admin/profesional/1/disponibilidad', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [
            { horaInicio: '09:00', horaFin: '09:30', estado: 'LIBRE' },
          ],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderCalendario({
      nutricionistaId: 1,
      fecha,
      slotSeleccionado: null,
      onFechaChange: vi.fn(),
      onSeleccionar,
    });

    const boton = await screen.findByTestId('slot-09:00');
    await user.click(boton);

    expect(onSeleccionar).toHaveBeenCalledWith({
      horaInicio: '09:00',
      horaFin: '09:30',
      estado: 'LIBRE',
    });
  });

  it('muestra empty state cuando la API devuelve lista vacia', async () => {
    const fecha = new Date('2027-02-01');
    server.use(
      http.get('*/turnos/admin/profesional/1/disponibilidad', () =>
        HttpResponse.json({
          success: true,
          message: 'ok',
          data: [],
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderCalendario({
      nutricionistaId: 1,
      fecha,
      slotSeleccionado: null,
      onFechaChange: vi.fn(),
      onSeleccionar: vi.fn(),
    });

    await waitFor(() => {
      expect(
        screen.getByText(/no hay horarios para esta fecha/i),
      ).toBeInTheDocument();
    });
  });
});
