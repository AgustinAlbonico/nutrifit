/**
 * Tests del hook useIa (Packet 5b) — mutations nuevas.
 *
 * Cubre:
 * - generarPlanSemanalV2: POST /ia/plan-semanal con payload, onSuccess
 *   invalida queries ['planes-alimentacion'] y ['planes-alimentacion',
 *   planAlimentacionId, 'versiones']
 * - regenerarPlanSemanal: POST /ia/plan-semanal/regenerar con scope,
 *   onSuccess invalida queries de planes-alimentacion
 * - Errores del backend se propagan correctamente
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/mocks/server';
import { useIa } from '@/hooks/useIa';
import type {
  RespuestaPlanSemanalV2FE,
  RespuestaRegeneracionFE,
  SolicitudPlanSemanalV2FE,
  SolicitudRegeneracionFE,
  GenerarIdeasComidaArgs,
  GenerarIdeasComidaRespuesta,
} from '@/types/ia';

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

describe('useIa — Packet 5b', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('generarPlanSemanalV2 hace POST a /ia/plan-semanal', async () => {
    let peticionUrl = '';
    let peticionBody: unknown = null;

    server.use(
      http.post('/ia/plan-semanal', ({ request }) => {
        peticionUrl = request.url;
        return request.json().then((body) => {
          peticionBody = body;
          return HttpResponse.json({
            planAlimentacionId: 50,
            versionId: 100,
            numeroVersion: 1,
            plan: { estructura: [], macrosPorDia: {}, razonamientoCumplimiento: { restriccionesCumplidas: [], restriccionesNoCumplidas: [] } },
            validacion: { restriccionesCumplidas: [], restriccionesNoCumplidas: [], advertencias: [] },
            macros: { cumpleEstructura: true, diasFaltantes: [], comidasFaltantes: [], advertencias: [], macrosPorDia: {}, bandaGlobal: 'VERDE', puedeAceptar: true },
            advertencias: [],
          });
        });
      }),
    );

    const { result } = renderHook(() => useIa(), { wrapper: crearWrapper() });

    const payload: SolicitudPlanSemanalV2FE = {
      socioId: 42,
      diasAGenerar: 7,
      comidasPorDia: 4,
      alternativasPorComida: 3,
    };

    let respuestaFinal!: RespuestaPlanSemanalV2FE;
    await act(async () => {
      respuestaFinal =
        await result.current.generarPlanSemanalV2.mutateAsync(payload);
    });

    expect(peticionUrl).toContain('/ia/plan-semanal');
    expect(peticionBody).toEqual(payload);
    expect(respuestaFinal.planAlimentacionId).toBe(50);
    expect(respuestaFinal.versionId).toBe(100);
  });

  it('generarPlanSemanalV2 desenvuelve ApiResponse estándar del backend', async () => {
    server.use(
      http.post('/ia/plan-semanal', () =>
        HttpResponse.json({
          success: true,
          message: 'Creado correctamente',
          data: {
            planAlimentacionId: 50,
            versionId: 100,
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
          },
          meta: null,
          errors: [],
        }),
      ),
    );

    const { result } = renderHook(() => useIa(), { wrapper: crearWrapper() });

    let respuestaFinal!: RespuestaPlanSemanalV2FE;
    await act(async () => {
      respuestaFinal = await result.current.generarPlanSemanalV2.mutateAsync({
        socioId: 42,
      });
    });

    expect(respuestaFinal.planAlimentacionId).toBe(50);
    expect(respuestaFinal.macros.macrosPorDia).toEqual({});
  });

  it('generarPlanSemanalV2 invalida queries de planes-alimentacion al éxito', async () => {
    server.use(
      http.post('/ia/plan-semanal', () =>
        HttpResponse.json({
          planAlimentacionId: 50,
          versionId: 100,
          numeroVersion: 1,
          plan: { estructura: [], macrosPorDia: {}, razonamientoCumplimiento: { restriccionesCumplidas: [], restriccionesNoCumplidas: [] } },
          validacion: { restriccionesCumplidas: [], restriccionesNoCumplidas: [], advertencias: [] },
          macros: { cumpleEstructura: true, diasFaltantes: [], comidasFaltantes: [], advertencias: [], macrosPorDia: {}, bandaGlobal: 'VERDE', puedeAceptar: true },
          advertencias: [],
        }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidarSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useIa(), { wrapper });

    await act(async () => {
      await result.current.generarPlanSemanalV2.mutateAsync({
        socioId: 42,
      });
    });

    // Debe invalidar ['planes-alimentacion']
    const invalidaciones = invalidarSpy.mock.calls.map((call) => call[0]);
    const invalidoPlanes = invalidaciones.some(
      (q) => (q as { queryKey?: unknown[] }).queryKey?.[0] === 'planes-alimentacion',
    );
    expect(invalidoPlanes).toBe(true);
  });

  it('regenerarPlanSemanal hace POST a /ia/plan-semanal/regenerar con scope=DIA', async () => {
    let peticionUrl = '';
    let peticionBody: unknown = null;

    server.use(
      http.post('/ia/plan-semanal/regenerar', ({ request }) => {
        peticionUrl = request.url;
        return request.json().then((body) => {
          peticionBody = body;
          return HttpResponse.json({
            nuevaVersionId: 200,
            numeroVersion: 5,
            motivoCambio: 'regeneracion_dia',
            cambios: { dias_modificados: ['MIERCOLES'] },
            validacion: { restriccionesCumplidas: [], restriccionesNoCumplidas: [], advertencias: [] },
            macros: { cumpleEstructura: true, diasFaltantes: [], comidasFaltantes: [], advertencias: [], macrosPorDia: {}, bandaGlobal: 'VERDE', puedeAceptar: true },
            plan: { estructura: [], macrosPorDia: {}, razonamientoCumplimiento: { restriccionesCumplidas: [], restriccionesNoCumplidas: [] } },
          });
        });
      }),
    );

    const { result } = renderHook(() => useIa(), { wrapper: crearWrapper() });

    const payload: SolicitudRegeneracionFE = {
      planAlimentacionVersionId: 100,
      scope: 'DIA',
      dia: 'MIERCOLES',
    };

    let respuestaFinal!: RespuestaRegeneracionFE;
    await act(async () => {
      respuestaFinal =
        await result.current.regenerarPlanSemanal.mutateAsync(payload);
    });

    expect(peticionUrl).toContain('/ia/plan-semanal/regenerar');
    expect(peticionBody).toEqual(payload);
    expect(respuestaFinal.motivoCambio).toBe('regeneracion_dia');
  });

  it('regenerarPlanSemanal acepta scope=ALTERNATIVA con comidaSlot + alternativaIndex', async () => {
    server.use(
      http.post('/ia/plan-semanal/regenerar', () =>
        HttpResponse.json({
          nuevaVersionId: 201,
          numeroVersion: 6,
          motivoCambio: 'regeneracion_alternativa',
          cambios: {
            comidas_modificadas: [
              { dia: 'LUNES', slot: 'DESAYUNO', alternativa: 1 },
            ],
          },
          validacion: { restriccionesCumplidas: [], restriccionesNoCumplidas: [], advertencias: [] },
          macros: { cumpleEstructura: true, diasFaltantes: [], comidasFaltantes: [], advertencias: [], macrosPorDia: {}, bandaGlobal: 'VERDE', puedeAceptar: true },
          plan: { estructura: [], macrosPorDia: {}, razonamientoCumplimiento: { restriccionesCumplidas: [], restriccionesNoCumplidas: [] } },
        }),
      ),
    );

    const { result } = renderHook(() => useIa(), { wrapper: crearWrapper() });

    await act(async () => {
      await result.current.regenerarPlanSemanal.mutateAsync({
        planAlimentacionVersionId: 100,
        scope: 'ALTERNATIVA',
        dia: 'LUNES',
        comidaSlot: 'DESAYUNO',
        alternativaIndex: 1,
      });
    });

    await waitFor(() => {
      expect(result.current.regenerarPlanSemanal.isSuccess).toBe(true);
    });
  });

  it('generarIdeasComida hace POST a /planes-alimentacion/:id/ideas-comida', async () => {
    let peticionUrl = '';
    let peticionBody: unknown = null;

    server.use(
      http.post('/planes-alimentacion/42/ideas-comida', ({ request }) => {
        peticionUrl = request.url;
        return request.json().then((body) => {
          peticionBody = body;
          return HttpResponse.json({
            promptUsado: 'Generar ideas para LUNES DESAYUNO',
            alternativas: [
              {
                idTemp: 'tmp-1',
                nombre: 'Avena con frutas',
                alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g', nombre: 'Avena' }],
                calorias: 350,
                proteinas: 12,
                carbohidratos: 60,
                grasas: 8,
                etiquetas: ['vegano'],
                warnings: [],
              },
            ],
          });
        });
      }),
    );

    const { result } = renderHook(() => useIa(), { wrapper: crearWrapper() });

    const payload: GenerarIdeasComidaArgs = {
      planAlimentacionId: 42,
      dia: 'LUNES',
      tipoComida: 'DESAYUNO',
      cantidadAlternativas: 10,
    };

    let respuestaFinal!: GenerarIdeasComidaRespuesta;
    await act(async () => {
      respuestaFinal = await result.current.generarIdeasComida.mutateAsync(payload);
    });

    expect(peticionUrl).toContain('/planes-alimentacion/42/ideas-comida');
    expect(peticionBody).toMatchObject({
      planAlimentacionId: 42,
      dia: 'LUNES',
      tipoComida: 'DESAYUNO',
      cantidadAlternativas: 10,
    });
    expect(respuestaFinal.alternativas).toHaveLength(1);
    expect(respuestaFinal.alternativas[0].nombre).toBe('Avena con frutas');
  });

  it('propaga errores del backend como excepción', async () => {
    server.use(
      http.post('/ia/plan-semanal', () =>
        HttpResponse.json(
          { message: 'Socio no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useIa(), { wrapper: crearWrapper() });

    await act(async () => {
      await expect(
        result.current.generarPlanSemanalV2.mutateAsync({ socioId: 999 }),
      ).rejects.toThrow();
    });
  });
});
