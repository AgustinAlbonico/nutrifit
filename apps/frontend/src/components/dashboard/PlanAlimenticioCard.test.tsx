import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { PlanAlimenticioCard } from './PlanAlimenticioCard';

const authConfig = {
  token: 'test-token-socio',
  personaId: 8,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: authConfig.token,
    personaId: authConfig.personaId,
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

function renderConQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('PlanAlimenticioCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    authConfig.token = 'test-token-socio';
    authConfig.personaId = 8;
  });

  it('PLAN-1: si no hay plan activo, muestra estado vacío sin reintentar la consulta', async () => {
    let cantidadLlamadas = 0;

    server.use(
      http.get('*/planes-alimentacion/socio/8/activo', () => {
        cantidadLlamadas += 1;
        return HttpResponse.json(
          {
            success: false,
            message: 'No se encontró el recurso solicitado.',
            error: {
              message: 'No se encontró el recurso solicitado.',
            },
          },
          { status: 404 },
        );
      }),
    );

    renderConQuery(<PlanAlimenticioCard />);

    await screen.findByText(/No tenes un plan alimenticio activo/i);

    await waitFor(() => {
      expect(screen.getByText(/Sin plan activo/i)).toBeInTheDocument();
      expect(cantidadLlamadas).toBe(1);
    });
  });
});
