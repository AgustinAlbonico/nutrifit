import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/mocks/server';
import { FeedbackModal } from '@/components/ia/FeedbackModal';

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

describe('FeedbackModal', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('renderiza título y los 2 botones de voto', () => {
    render(
      <FeedbackModal
        open={true}
        onOpenChange={vi.fn()}
        versionId={456}
      />,
      { wrapper: crearWrapper() },
    );

    expect(screen.getByText(/Tu feedback/i)).toBeInTheDocument();
    expect(screen.getByTestId('feedback-positivo')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-negativo')).toBeInTheDocument();
    expect(screen.getByLabelText('Comentario (opcional)')).toBeInTheDocument();
  });

  it('envía voto POSITIVO y cierra el modal al éxito', async () => {
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    let peticionUrl = '';
    server.use(
      http.post(
        '/planes-alimentacion/version/456/feedback',
        ({ request }) => {
          peticionUrl = request.url;
          return HttpResponse.json({
            id: 1,
            planAlimentacionVersionId: 456,
            voto: 'POSITIVO',
            comentario: null,
            createdAt: '2026-06-25T10:00:00.000Z',
            updatedAt: '2026-06-25T10:00:00.000Z',
          });
        },
      ),
    );

    const user = userEvent.setup();
    render(
      <FeedbackModal
        open={true}
        onOpenChange={onOpenChange}
        versionId={456}
        onSuccess={onSuccess}
      />,
      { wrapper: crearWrapper() },
    );

    await user.click(screen.getByTestId('feedback-positivo'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(peticionUrl).toContain('/planes-alimentacion/version/456/feedback');
  });

  it('envía voto NEGATIVO con comentario', async () => {
    const onOpenChange = vi.fn();

    let bodyRecibido: unknown = null;
    server.use(
      http.post(
        '/planes-alimentacion/version/789/feedback',
        ({ request }) =>
          request.json().then((b) => {
            bodyRecibido = b;
            return HttpResponse.json({
              id: 2,
              planAlimentacionVersionId: 789,
              voto: 'NEGATIVO',
              comentario: 'Repitió mucho pollo',
              createdAt: '2026-06-25T10:00:00.000Z',
              updatedAt: '2026-06-25T10:00:00.000Z',
            });
          }),
      ),
    );

    const user = userEvent.setup();
    render(
      <FeedbackModal
        open={true}
        onOpenChange={onOpenChange}
        versionId={789}
      />,
      { wrapper: crearWrapper() },
    );

    await user.type(
      screen.getByLabelText('Comentario (opcional)'),
      'Repitió mucho pollo',
    );
    await user.click(screen.getByTestId('feedback-negativo'));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(bodyRecibido).toEqual({
      voto: 'NEGATIVO',
      comentario: 'Repitió mucho pollo',
    });
  });

  it('muestra el contador de caracteres y avisa cuando se excede', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackModal
        open={true}
        onOpenChange={vi.fn()}
        versionId={1}
      />,
      { wrapper: crearWrapper() },
    );

    const textarea = screen.getByLabelText('Comentario (opcional)');
    await user.type(textarea, 'a'.repeat(50));

    expect(screen.getByText(/50 \/ 500 caracteres/i)).toBeInTheDocument();
  });
});