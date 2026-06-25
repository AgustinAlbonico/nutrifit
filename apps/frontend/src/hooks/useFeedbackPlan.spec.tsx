import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/mocks/server';
import { useFeedbackPlan } from '@/hooks/useFeedbackPlan';
import type { PlanFeedbackFE } from '@/types/ia';

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

describe('useFeedbackPlan', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('envía POST con voto positivo y sin comentario', async () => {
    let peticionUrl = '';
    let bodyRecibido: unknown = null;

    const feedbackEsperado: PlanFeedbackFE = {
      id: 99,
      planAlimentacionVersionId: 456,
      voto: 'POSITIVO',
      comentario: null,
      createdAt: '2026-06-25T10:00:00.000Z',
      updatedAt: '2026-06-25T10:00:00.000Z',
    };

    server.use(
      http.post('/planes-alimentacion/version/456/feedback', ({ request }) => {
        peticionUrl = request.url;
        return request.json().then((b) => {
          bodyRecibido = b;
          return HttpResponse.json(feedbackEsperado);
        });
      }),
    );

    const { result } = renderHook(
      () => useFeedbackPlan({ versionId: 456 }),
      { wrapper: crearWrapper() },
    );

    await act(async () => {
      result.current.votar({ voto: 'POSITIVO' });
    });

    await waitFor(() => {
      expect(result.current.isVoting).toBe(false);
    });

    expect(peticionUrl).toContain('/planes-alimentacion/version/456/feedback');
    expect(bodyRecibido).toEqual({ voto: 'POSITIVO', comentario: undefined });
    expect(result.current.feedback?.voto).toBe('POSITIVO');
    expect(result.current.esExitoso).toBe(true);
  });

  it('envía POST con voto negativo y comentario', async () => {
    let bodyRecibido: unknown = null;

    server.use(
      http.post('/planes-alimentacion/version/123/feedback', ({ request }) =>
        request.json().then((b) => {
          bodyRecibido = b;
          return HttpResponse.json({
            id: 5,
            planAlimentacionVersionId: 123,
            voto: 'NEGATIVO',
            comentario: 'Repitió mucho pollo',
            createdAt: '2026-06-25T10:00:00.000Z',
            updatedAt: '2026-06-25T10:00:00.000Z',
          });
        }),
      ),
    );

    const { result } = renderHook(
      () => useFeedbackPlan({ versionId: 123 }),
      { wrapper: crearWrapper() },
    );

    await act(async () => {
      result.current.votar({ voto: 'NEGATIVO', comentario: 'Repitió mucho pollo' });
    });

    await waitFor(() => {
      expect(result.current.isVoting).toBe(false);
    });

    expect(bodyRecibido).toEqual({
      voto: 'NEGATIVO',
      comentario: 'Repitió mucho pollo',
    });
    expect(result.current.feedback?.comentario).toBe('Repitió mucho pollo');
  });

  it('usa PUT cuando se pasa editar=true', async () => {
    let metodoUsado = '';

    server.use(
      http.put('/planes-alimentacion/version/77/feedback', ({ request }) => {
        metodoUsado = request.method;
        return HttpResponse.json({
          id: 1,
          planAlimentacionVersionId: 77,
          voto: 'POSITIVO',
          comentario: 'Editado',
          createdAt: '2026-06-25T10:00:00.000Z',
          updatedAt: '2026-06-25T11:00:00.000Z',
        });
      }),
      http.post('/planes-alimentacion/version/77/feedback', () =>
        HttpResponse.json(
          { error: 'no debería haberse llamado POST' },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(
      () => useFeedbackPlan({ versionId: 77, editar: true }),
      { wrapper: crearWrapper() },
    );

    await act(async () => {
      result.current.votar({ voto: 'POSITIVO', comentario: 'Editado' });
    });

    await waitFor(() => {
      expect(result.current.isVoting).toBe(false);
    });

    expect(metodoUsado).toBe('PUT');
    expect(result.current.feedback?.comentario).toBe('Editado');
  });
});