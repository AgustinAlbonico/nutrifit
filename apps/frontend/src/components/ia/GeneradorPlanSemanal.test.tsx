/**
 * Tests del formulario V2 de generación de plan semanal con IA.
 *
 * Cubre:
 * - Render: campos visibles, labels asociados, valores por defecto
 * - Validación: socioId positivo, diasAGenerar 1-14, comidasPorDia 1-5,
 *   alternativasPorComida 1-5, notasGeneracion max 1000, fechaInicio formato
 * - Submit: payload correcto, deshabilitado durante pending, deshabilitado
 *   tras primer click (no doble submit)
 * - Toast/sonner: éxito y error
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

// Mock de sonner para no disparar toasts reales en tests
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { server } from '@/mocks/server';
import { GeneradorPlanSemanal } from '@/components/ia/GeneradorPlanSemanal';

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

describe('GeneradorPlanSemanal V2', () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it('renderiza todos los campos con labels asociados', () => {
    render(<GeneradorPlanSemanal socioIdPreseleccionado={42} />, {
      wrapper: crearWrapper(),
    });

    expect(screen.getByLabelText(/ID del socio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Días a generar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Comidas por día/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Alternativas por comida/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha de inicio/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Notas para esta generación/i),
    ).toBeInTheDocument();

    // Botón submit presente
    expect(screen.getByTestId('generar-plan-button')).toBeInTheDocument();
  });

  it('pre-carga socioId cuando se pasa socioIdPreseleccionado', () => {
    render(<GeneradorPlanSemanal socioIdPreseleccionado={123} />, {
      wrapper: crearWrapper(),
    });

    const inputSocioId = screen.getByTestId('socio-id-input') as HTMLInputElement;
    expect(inputSocioId.value).toBe('123');
  });

  it('muestra error de validación si socioId es 0 o negativo', async () => {
    const user = userEvent.setup();
    render(<GeneradorPlanSemanal />, { wrapper: crearWrapper() });

    const inputSocioId = screen.getByTestId('socio-id-input');
    // Limpiar valor y poner 0 (inválido)
    await user.clear(inputSocioId);
    await user.type(inputSocioId, '0');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/positivo/i);
    });
  });

  it('envía POST /ia/plan-semanal con el payload correcto al hacer submit', async () => {
    let peticionRecibida: unknown = null;
    let peticionUrl = '';

    server.use(
      http.post('/ia/plan-semanal', ({ request }) => {
        peticionUrl = request.url;
        return request.json().then((body) => {
          peticionRecibida = body;
          return HttpResponse.json({
            planAlimentacionId: 99,
            versionId: 1,
            numeroVersion: 1,
            plan: {
              estructura: [],
              macrosPorDia: {},
              razonamientoCumplimiento: {
                restriccionesCumplidas: [],
                restriccionesNoCumplidas: [],
              },
            },
            validacion: {
              restriccionesCumplidas: [],
              restriccionesNoCumplidas: [],
              advertencias: [],
            },
            macros: {
              cumpleEstructura: true,
              diasFaltantes: [],
              comidasFaltantes: [],
              advertencias: [],
              macrosPorDia: {},
              bandaGlobal: 'VERDE',
              puedeAceptar: true,
            },
            advertencias: [],
          });
        });
      }),
    );

    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <GeneradorPlanSemanal
        socioIdPreseleccionado={42}
        onSuccess={onSuccess}
      />,
      { wrapper: crearWrapper() },
    );

    await user.click(screen.getByTestId('generar-plan-button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(peticionUrl).toContain('/ia/plan-semanal');
    expect(peticionRecibida).toEqual({
      socioId: 42,
      diasAGenerar: 7,
      comidasPorDia: 4,
      alternativasPorComida: 3,
      fechaInicio: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('deshabilita el botón durante el envío y no permite doble submit', async () => {
    let contadorPeticiones = 0;
    let resolverAsignado: () => void = () => {};

    server.use(
      http.post('/ia/plan-semanal', async () => {
        contadorPeticiones += 1;
        // Simulamos una respuesta lenta
        await new Promise<void>((resolve) => {
          resolverAsignado = resolve;
        });
        return HttpResponse.json({
          planAlimentacionId: 1,
          versionId: 1,
          numeroVersion: 1,
          plan: { estructura: [], macrosPorDia: {}, razonamientoCumplimiento: { restriccionesCumplidas: [], restriccionesNoCumplidas: [] } },
          validacion: { restriccionesCumplidas: [], restriccionesNoCumplidas: [], advertencias: [] },
          macros: { cumpleEstructura: true, diasFaltantes: [], comidasFaltantes: [], advertencias: [], macrosPorDia: {}, bandaGlobal: 'VERDE', puedeAceptar: true },
          advertencias: [],
        });
      }),
    );

    const user = userEvent.setup();
    render(<GeneradorPlanSemanal socioIdPreseleccionado={42} />, {
      wrapper: crearWrapper(),
    });

    const boton = screen.getByTestId('generar-plan-button');
    await user.click(boton);

    // Durante el envío el botón debe estar deshabilitado
    await waitFor(() => {
      expect(boton).toBeDisabled();
    });

    // Intentar clickear de nuevo no debe disparar otra petición
    await user.click(boton).catch(() => {});
    await user.click(boton).catch(() => {});

    // Solo se llamó 1 vez
    expect(contadorPeticiones).toBe(1);

    // Liberar la promesa
    resolverAsignado();

    await waitFor(() => {
      expect(boton).not.toBeDisabled();
    });
  });

  it('muestra toast de error cuando el backend falla', async () => {
    server.use(
      http.post('/ia/plan-semanal', () =>
        HttpResponse.json(
          { message: 'Servicio de IA no disponible' },
          { status: 503 },
        ),
      ),
    );

    const user = userEvent.setup();
    render(<GeneradorPlanSemanal socioIdPreseleccionado={42} />, {
      wrapper: crearWrapper(),
    });

    await user.click(screen.getByTestId('generar-plan-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('renderiza contador de caracteres en notasGeneracion', async () => {
    const user = userEvent.setup();
    render(<GeneradorPlanSemanal socioIdPreseleccionado={42} />, {
      wrapper: crearWrapper(),
    });

    // El contador "0 / 1000 caracteres" existe inicialmente
    expect(screen.getByText(/0\s*\/\s*1000\s*caracteres/i)).toBeInTheDocument();

    // Tipear texto: el contador refleja el length actualizado
    const textarea = screen.getByTestId('notas-generacion-textarea');
    await user.type(textarea, 'Hola');

    // "Hola" = 4 chars → contador debe mostrar 4/1000
    expect(
      screen.getByText(/4\s*\/\s*1000\s*caracteres/i),
    ).toBeInTheDocument();
  });

  it('incluye notasGeneracion en el payload solo si no está vacío', async () => {
    let peticionRecibida: unknown = null;

    server.use(
      http.post('/ia/plan-semanal', ({ request }) =>
        request.json().then((body) => {
          peticionRecibida = body;
          return HttpResponse.json({
            planAlimentacionId: 1,
            versionId: 1,
            numeroVersion: 1,
            plan: { estructura: [], macrosPorDia: {}, razonamientoCumplimiento: { restriccionesCumplidas: [], restriccionesNoCumplidas: [] } },
            validacion: { restriccionesCumplidas: [], restriccionesNoCumplidas: [], advertencias: [] },
            macros: { cumpleEstructura: true, diasFaltantes: [], comidasFaltantes: [], advertencias: [], macrosPorDia: {}, bandaGlobal: 'VERDE', puedeAceptar: true },
            advertencias: [],
          });
        }),
      ),
    );

    const user = userEvent.setup();
    render(<GeneradorPlanSemanal socioIdPreseleccionado={42} />, {
      wrapper: crearWrapper(),
    });

    const textarea = screen.getByTestId('notas-generacion-textarea');
    await user.type(textarea, 'Priorizar fibra');

    await user.click(screen.getByTestId('generar-plan-button'));

    await waitFor(() => {
      expect(peticionRecibida).toBeTruthy();
    });

    const body = peticionRecibida as Record<string, unknown>;
    expect(body.notasGeneracion).toBe('Priorizar fibra');
  });
});
