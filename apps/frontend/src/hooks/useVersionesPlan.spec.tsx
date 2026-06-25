import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/mocks/server';
import { useVersionesPlan } from '@/hooks/useVersionesPlan';
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
    numeroVersion: 5,
    motivoCambio: 'regeneracion_dia',
    activa: false,
    createdAt: '2026-06-20T12:00:00.000Z',
    createdBy: 1,
  },
  {
    idPlanAlimentacionVersion: 29,
    idPlanAlimentacion: 10,
    numeroVersion: 4,
    motivoCambio: 'edicion_manual',
    activa: true,
    createdAt: '2026-06-19T12:00:00.000Z',
    createdBy: 1,
  },
  {
    idPlanAlimentacionVersion: 28,
    idPlanAlimentacion: 10,
    numeroVersion: 3,
    motivoCambio: 'regeneracion_completa',
    activa: false,
    createdAt: '2026-06-18T12:00:00.000Z',
    createdBy: 1,
  },
  {
    idPlanAlimentacionVersion: 27,
    idPlanAlimentacion: 10,
    numeroVersion: 2,
    motivoCambio: 'edicion_manual',
    activa: false,
    createdAt: '2026-06-17T12:00:00.000Z',
    createdBy: 1,
  },
  {
    idPlanAlimentacionVersion: 26,
    idPlanAlimentacion: 10,
    numeroVersion: 1,
    motivoCambio: 'creacion_inicial',
    activa: false,
    createdAt: '2026-06-16T12:00:00.000Z',
    createdBy: 1,
  },
];

describe('useVersionesPlan', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('carga la lista de versiones del plan', async () => {
    server.use(
      http.get('/planes-alimentacion/10/versiones', () =>
        HttpResponse.json({ versiones: versionesMock }),
      ),
    );

    const { result } = renderHook(() => useVersionesPlan(10), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(5);
    expect(result.current.data?.[0]?.numeroVersion).toBe(5);
    expect(result.current.data?.[0]?.activa).toBe(false);
    expect(result.current.data?.[1]?.activa).toBe(true);
  });

  it('no ejecuta la query si planId no es válido', async () => {
    let peticiones = 0;
    server.use(
      http.get('/planes-alimentacion/0/versiones', () => {
        peticiones++;
        return HttpResponse.json({ versiones: [] });
      }),
    );

    const { result } = renderHook(() => useVersionesPlan(0), {
      wrapper: crearWrapper(),
    });

    // No debería disparar fetch porque enabled = false
    await new Promise((r) => setTimeout(r, 50));
    expect(peticiones).toBe(0);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('marca error cuando el backend responde 404', async () => {
    server.use(
      http.get('/planes-alimentacion/99/versiones', () =>
        HttpResponse.json(
          { message: 'plan no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useVersionesPlan(99), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('respeta staleTime de 30s en el cache entre fetches', async () => {
    let contadorPeticiones = 0;
    server.use(
      http.get('/planes-alimentacion/10/versiones', () => {
        contadorPeticiones++;
        return HttpResponse.json({ versiones: versionesMock });
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useVersionesPlan(10), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Primer fetch ya hecho
    expect(contadorPeticiones).toBe(1);

    // Re-render inmediato no debe disparar nuevo fetch (dentro de staleTime)
    await new Promise((r) => setTimeout(r, 50));
    expect(contadorPeticiones).toBe(1);
  });
});