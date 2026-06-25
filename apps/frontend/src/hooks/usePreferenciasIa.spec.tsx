import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/mocks/server';
import { usePreferenciasIa } from '@/hooks/usePreferenciasIa';

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

describe('usePreferenciasIa', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('carga las preferencias iniciales del nutricionista', async () => {
    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({
          preferencias: 'Priorizar fibra, evitar ultraprocesados',
        }),
      ),
    );

    const { result } = renderHook(() => usePreferenciasIa(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.preferencias).toBe(
      'Priorizar fibra, evitar ultraprocesados',
    );
    expect(result.current.isError).toBe(false);
  });

  it('retorna string vacío cuando el backend no tiene preferencias', async () => {
    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({ preferencias: '' }),
      ),
    );

    const { result } = renderHook(() => usePreferenciasIa(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.preferencias).toBe('');
  });

  it('guarda las preferencias con PUT y actualiza el cache', async () => {
    let bodyRecibido: unknown = null;

    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({ preferencias: '' }),
      ),
      http.put('/profesional/mi-perfil/preferencias-ia', async ({ request }) => {
        bodyRecibido = await request.json();
        return HttpResponse.json({
          preferencias: 'Nueva preferencia persistida',
        });
      }),
    );

    const { result } = renderHook(() => usePreferenciasIa(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.guardar('  Nueva preferencia persistida  ');

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(bodyRecibido).toEqual({ preferencias: 'Nueva preferencia persistida' });
    expect(result.current.preferencias).toBe('Nueva preferencia persistida');
    expect(result.current.guardadoOk).toBe(true);
  });

  it('rechaza guardar texto mayor a 2000 caracteres en cliente', async () => {
    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({ preferencias: '' }),
      ),
    );

    const { result } = renderHook(() => usePreferenciasIa(), {
      wrapper: crearWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const textoExcedido = 'a'.repeat(2001);
    result.current.guardar(textoExcedido);

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(result.current.errorGuardado).toBeInstanceOf(Error);
    expect(result.current.guardadoOk).toBe(false);
  });
});