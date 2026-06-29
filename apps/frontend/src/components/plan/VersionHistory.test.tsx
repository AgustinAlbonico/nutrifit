import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/mocks/server';
import { VersionHistory } from '@/components/plan/VersionHistory';
import type { VersionPlanFE } from '@/types/ia';

function crearWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const versionesMock: VersionPlanFE[] = [
  {
    idPlanAlimentacionVersion: 30,
    idPlanAlimentacion: 10,
    numeroVersion: 3,
    motivoCambio: 'regeneracion_dia',
    activa: false,
    createdAt: '2026-06-20T12:00:00.000Z',
    createdBy: 1,
  },
  {
    idPlanAlimentacionVersion: 29,
    idPlanAlimentacion: 10,
    numeroVersion: 2,
    motivoCambio: 'edicion_manual',
    activa: true,
    createdAt: '2026-06-19T12:00:00.000Z',
    createdBy: 1,
  },
  {
    idPlanAlimentacionVersion: 28,
    idPlanAlimentacion: 10,
    numeroVersion: 1,
    motivoCambio: 'creacion_inicial',
    activa: false,
    createdAt: '2026-06-18T12:00:00.000Z',
    createdBy: 1,
  },
];

describe('VersionHistory', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('lista las versiones ordenadas DESC y marca la activa', async () => {
    server.use(
      http.get('/planes-alimentacion/10/versiones', () =>
        HttpResponse.json({ versiones: versionesMock }),
      ),
    );

    render(<VersionHistory planId={10} />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(screen.getAllByTestId('version-item')).toHaveLength(3);
    });

    const items = screen.getAllByTestId('version-item');
    expect(items[0]).toHaveAttribute('data-version-id', '30');
    expect(items[0]).toHaveAttribute('data-activa', 'false');
    expect(items[1]).toHaveAttribute('data-activa', 'true');

    expect(screen.getByLabelText(/Activa/i)).toBeInTheDocument();
    expect(screen.getByText(/v3/i)).toBeInTheDocument();
    expect(screen.getByText(/v2/i)).toBeInTheDocument();
    expect(screen.getByText(/v1/i)).toBeInTheDocument();
  });

  it('normaliza la respuesta real envuelta del backend', async () => {
    server.use(
      http.get('/planes-alimentacion/10/versiones', () =>
        HttpResponse.json({
          success: true,
          message: 'Datos obtenidos correctamente',
          data: [
            {
              id: 30,
              numeroVersion: 3,
              motivoCambio: 'regeneracion_dia',
              activa: false,
              createdAt: '2026-06-20T12:00:00.000Z',
              createdBy: 1,
            },
            {
              id: 29,
              numeroVersion: 2,
              motivoCambio: 'edicion_manual',
              activa: true,
              createdAt: '2026-06-19T12:00:00.000Z',
              createdBy: 1,
            },
          ],
          meta: null,
          errors: [],
        }),
      ),
    );

    render(<VersionHistory planId={10} />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(screen.getAllByTestId('version-item')).toHaveLength(2);
    });

    expect(screen.getAllByTestId('version-item')[0]).toHaveAttribute(
      'data-version-id',
      '30',
    );
    expect(screen.getByText(/v3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Activa/i)).toBeInTheDocument();
  });

  it('invoca onSelect al hacer click en una versión', async () => {
    server.use(
      http.get('/planes-alimentacion/10/versiones', () =>
        HttpResponse.json({ versiones: versionesMock }),
      ),
    );

    const onSelect = vi.fn();

    const user = userEvent.setup();
    render(
      <VersionHistory planId={10} onSelect={onSelect} />,
      { wrapper: crearWrapper() },
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('version-item')).toHaveLength(3);
    });

    await user.click(screen.getAllByTestId('version-item')[0]); // primera = v3

    expect(onSelect).toHaveBeenCalledWith(30);
  });

  it('marca la versión seleccionada con aria-current=true', async () => {
    server.use(
      http.get('/planes-alimentacion/10/versiones', () =>
        HttpResponse.json({ versiones: versionesMock }),
      ),
    );

    render(
      <VersionHistory planId={10} versionSeleccionadaId={29} />,
      { wrapper: crearWrapper() },
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('version-item')).toHaveLength(3);
    });

    const items = screen.getAllByTestId('version-item');
    expect(items[1]).toHaveAttribute('aria-current', 'true');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('muestra mensaje de error cuando el backend falla', async () => {
    server.use(
      http.get('/planes-alimentacion/99/versiones', () =>
        HttpResponse.json({ message: 'fallo' }, { status: 500 }),
      ),
    );

    render(<VersionHistory planId={99} />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('muestra estado vacío cuando no hay versiones', async () => {
    server.use(
      http.get('/planes-alimentacion/20/versiones', () =>
        HttpResponse.json({ versiones: [] }),
      ),
    );

    render(<VersionHistory planId={20} />, { wrapper: crearWrapper() });

    expect(
      await screen.findByText(/todavía no tiene versiones/i),
    ).toBeInTheDocument();
  });
});
