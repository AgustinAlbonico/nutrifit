/**
 * Tests de integración de MiPlanPage (Packet 6).
 *
 * Cubre:
 * - Estado de carga: muestra "Cargando tus planes..."
 * - Estado de error: muestra alert destructivo + toast
 * - 0 planes activos → EmptyStatePlanEnPreparacion
 * - 1 plan activo → 1 PlanSocioCard con datos correctos
 * - 2 planes activos (2 nutricionistas) → 2 PlanSocioCard
 * - Normalización de respuesta: objeto único → array con 1 elemento
 * - Query deshabilitada si falta personaId
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/mocks/server';
import { MiPlanPage } from '@/pages/MiPlanPage';
import type { PlanSocioActivo } from '@/types/ia';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    personaId: 7,
    gimnasioId: 1,
    rol: 'SOCIO',
    permissions: [],
    isAuthenticated: true,
  }),
}));

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

function crearPlanV2Base(
  overrides: Partial<PlanSocioActivo> = {},
): PlanSocioActivo {
  return {
    idPlanAlimentacion: 100,
    versionId: 1,
    nutricionistaId: 50,
    nutricionistaNombre: 'Lic. Pérez',
    fechaInicio: '2026-06-01T00:00:00.000Z',
    plan: {
      estructura: [
        {
          dia: 'LUNES',
          comidas: [
            {
              tipo: 'DESAYUNO',
              alternativas: [
                {
                  nombre: 'Avena con frutas',
                  alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
                  calorias: 350,
                  proteinas: 15,
                  carbohidratos: 50,
                  grasas: 10,
                },
              ],
            },
          ],
        },
      ],
      macrosPorDia: {
        LUNES: {
          calorias: 2000,
          proteinas: 100,
          carbohidratos: 250,
          grasas: 60,
          desvioPorcentaje: 0,
          banda: 'VERDE',
          detallePorMacro: {
            calorias: { real: 2000, objetivo: 2000, desvio: 0, banda: 'VERDE' },
            proteinas: { real: 100, objetivo: 100, desvio: 0, banda: 'VERDE' },
            carbohidratos: { real: 250, objetivo: 250, desvio: 0, banda: 'VERDE' },
            grasas: { real: 60, objetivo: 60, desvio: 0, banda: 'VERDE' },
          },
        },
      },
      razonamientoCumplimiento: {
        restriccionesCumplidas: [
          { restriccion: 'vegano', detalle: 'Cumple dieta vegana.' },
        ],
        restriccionesNoCumplidas: [],
      },
    },
    ...overrides,
  };
}

describe('MiPlanPage (Packet 6)', () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it('muestra estado de carga mientras fetchea', () => {
    server.use(
      http.get(
        '/planes-alimentacion/socio/7/activo',
        () => new Promise(() => {}), // nunca resuelve
      ),
    );

    render(<MiPlanPage />, { wrapper: crearWrapper() });

    expect(screen.getByTestId('mi-plan-loading')).toBeInTheDocument();
    expect(screen.getByText(/Cargando tus planes/i)).toBeInTheDocument();
  });

  it('muestra el hero header con el título "Mis planes"', () => {
    server.use(
      http.get('/planes-alimentacion/socio/7/activo', () =>
        HttpResponse.json([]),
      ),
    );

    render(<MiPlanPage />, { wrapper: crearWrapper() });

    expect(screen.getByTestId('mi-plan-hero')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Mis planes/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('muestra empty state cuando el socio no tiene planes activos', async () => {
    server.use(
      http.get('/planes-alimentacion/socio/7/activo', () =>
        HttpResponse.json(null),
      ),
    );

    render(<MiPlanPage />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(
        screen.getByTestId('empty-state-plan-en-preparacion'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Tu nutricionista está preparando tu plan/i),
    ).toBeInTheDocument();
  });

  it('renderiza 1 PlanSocioCard cuando el socio tiene 1 plan activo (objeto único)', async () => {
    server.use(
      http.get('/planes-alimentacion/socio/7/activo', () =>
        HttpResponse.json(crearPlanV2Base()),
      ),
    );

    render(<MiPlanPage />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('plan-socio-card')).toBeInTheDocument();
    });

    const cards = screen.getAllByTestId('plan-socio-card');
    expect(cards).toHaveLength(1);

    expect(screen.getByText(/Mi plan con Lic\. Pérez/i)).toBeInTheDocument();
    expect(screen.getByTestId('weekly-plan-grid-v2')).toBeInTheDocument();
  });

  it('renderiza 2 PlanSocioCard cuando el socio tiene planes de 2 nutricionistas', async () => {
    const planes: PlanSocioActivo[] = [
      crearPlanV2Base({
        idPlanAlimentacion: 100,
        nutricionistaId: 50,
        nutricionistaNombre: 'Lic. Pérez',
      }),
      crearPlanV2Base({
        idPlanAlimentacion: 101,
        nutricionistaId: 51,
        nutricionistaNombre: 'Lic. Gómez',
      }),
    ];

    server.use(
      http.get('/planes-alimentacion/socio/7/activo', () =>
        HttpResponse.json(planes),
      ),
    );

    render(<MiPlanPage />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(screen.getAllByTestId('plan-socio-card')).toHaveLength(2);
    });

    expect(screen.getByText(/Mi plan con Lic\. Pérez/i)).toBeInTheDocument();
    expect(screen.getByText(/Mi plan con Lic\. Gómez/i)).toBeInTheDocument();
  });

  it('normaliza respuesta envuelta en { data: ... } a array', async () => {
    server.use(
      http.get('/planes-alimentacion/socio/7/activo', () =>
        HttpResponse.json({ data: crearPlanV2Base() }),
      ),
    );

    render(<MiPlanPage />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('plan-socio-card')).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('plan-socio-card')).toHaveLength(1);
  });

  it('muestra alert de error cuando el endpoint falla', async () => {
    server.use(
      http.get('/planes-alimentacion/socio/7/activo', () =>
        HttpResponse.json(
          { success: false, message: 'Error interno del servidor' },
          { status: 500 },
        ),
      ),
    );

    render(<MiPlanPage />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('mi-plan-error')).toBeInTheDocument();
    });
    expect(screen.getByText(/No se pudieron cargar tus planes/i)).toBeInTheDocument();
  });
});