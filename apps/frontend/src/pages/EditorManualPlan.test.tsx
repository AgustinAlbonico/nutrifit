/**
 * Tests de EditorManualPlan (Task 2.9).
 *
 * Verifica:
 * 1. Renderiza grilla + sticky footer con botón "Guardar borrador"
 * 2. Al click "Guardar borrador" → POST /planes-alimentacion/:id/persistir-manual
 *
 * Stack: Vitest + @testing-library/react + MSW + React Query.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { EditorManualPlan } from '@/pages/EditorManualPlan';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    rol: 'NUTRICIONISTA',
    permissions: [],
    personaId: 1,
    isAuthenticated: true,
  }),
}));

// GrillaManualSlots ya existe — se importa realmente en el test
// (el test existe en GrillaManualSlots.test.tsx)

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('EditorManualPlan', () => {
  describe('Test 1: Renderiza grilla + sticky footer', () => {
    it('renderiza el componente y muestra los elementos esperados', async () => {
      // Override para que devuelva versión vacía
      server.use(
        http.get('/planes-alimentacion/:id/versiones', () =>
          HttpResponse.json({ success: true, data: { versiones: [] } }),
        ),
      );

      render(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <EditorManualPlan planId={42} pacienteNombre="Juan Pérez" />
        </QueryClientProvider>,
      );

      // Header visible
      expect(screen.getByText('Editor Manual')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();

      // Grilla manual slots renderiza (usa componente real de Task 2.8)
      expect(screen.getByTestId('grilla-manual-slots')).toBeInTheDocument();

      // Footer sticky con botón
      const footer = screen.getByTestId('editor-manual-plan-footer');
      expect(footer).toBeInTheDocument();

      const boton = screen.getByTestId('btn-guardar-borrador');
      expect(boton).toBeInTheDocument();
      expect(boton).toHaveTextContent('Guardar borrador');
    });
  });

  describe('Test 2: Al click "Guardar borrador" → POST /persistir-manual', () => {
    it('invoca POST /planes-alimentacion/:id/persistir-manual con body dias[]', async () => {
      let cuerpoPersistir: unknown = null;
      server.use(
        http.get('/planes-alimentacion/:id/versiones', () =>
          HttpResponse.json({
            success: true,
            data: {
              versiones: [
                {
                  idPlanAlimentacionVersion: 7,
                  idPlanAlimentacion: 42,
                  numeroVersion: 1,
                  motivoCambio: 'creacion_inicial',
                  activa: true,
                  createdAt: '2026-01-01T00:00:00Z',
                  createdBy: 1,
                },
              ],
            },
          }),
        ),
        http.post('/planes-alimentacion/:id/persistir-manual', async ({ request }) => {
          cuerpoPersistir = await request.json();
          return HttpResponse.json({ versionId: 8 });
        }),
      );

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <EditorManualPlan planId={42} pacienteNombre="Ana García" />
        </QueryClientProvider>,
      );

      // Esperar a que cargue la versión
      await waitFor(() => {
        expect(screen.queryByText(/Cargando/)).not.toBeInTheDocument();
      });

      // Click en Guardar borrador
      const boton = screen.getByTestId('btn-guardar-borrador');
      await userEvent.click(boton);

      // Esperar que se complete la mutation
      await waitFor(() => {
        expect(cuerpoPersistir).not.toBeNull();
      });

      // Verificar shape del body
      expect(cuerpoPersistir).toHaveProperty('dias');
      expect(Array.isArray((cuerpoPersistir as { dias: unknown }).dias)).toBe(true);
      const dias = (cuerpoPersistir as { dias: unknown[] }).dias;
      // 7 días (estructura inicial)
      expect(dias).toHaveLength(7);
      // Cada día tiene comidas
      const primerDia = dias[0] as { comidas: unknown[] };
      expect(primerDia.comidas).toBeDefined();
    });
  });
});
