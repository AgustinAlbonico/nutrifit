/**
 * Tests de integración del PlanEditorPage refactor (Packet 5b).
 *
 * Verifica que la página compone correctamente:
 * - GeneradorPlanSemanal (form V2) → al éxito setea respuesta + plan visible
 * - WeeklyPlanGrid V2 con MacrosBadge + botones regen
 * - VersionHistory sidebar
 * - RazonamientoCumplimiento colapsable
 * - FeedbackModal trigger (botón flotante)
 *
 * Usa MSW para mockear los endpoints del backend.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

const authMock = vi.hoisted(() => ({
  token: 'mock-token',
  personaId: 1,
  gimnasioId: 1,
  rol: 'NUTRICIONISTA',
  permissions: ['PLANES_IA_GENERAR'],
  isAuthenticated: true,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock del AuthContext para evitar dependencias de localStorage / tokens
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authMock,
}));

// Mock del router de TanStack para usar MemoryRouter
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ socioId: '42' }),
  useNavigate: () => vi.fn(),
  createRouter: vi.fn(),
  createRoute: vi.fn(),
  createRootRoute: vi.fn(),
  Outlet: () => null,
  redirect: vi.fn(),
  RouterProvider: ({ children }: { children: ReactNode }) => children,
}));

import { GeneracionPlanIaProvider } from '@/contexts/GeneracionPlanIaContext';
import { server } from '@/mocks/server';
import { PlanEditorPage } from '@/pages/PlanEditorPage';
import type {
  GeneracionPlanIaFE,
  PlanAlimentacionDatosJsonFE,
  RespuestaPlanSemanalV2FE,
  VersionPlanFE,
} from '@/types/ia';
import type { FichaSaludSocio } from '@/types/ficha-salud';

function crearWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GeneracionPlanIaProvider>{children}</GeneracionPlanIaProvider>
    </QueryClientProvider>
  );
}

/**
 * Genera una generación IA en estado COMPLETADO con la respuesta V2 indicada.
 * El editor consume el resultado desde el polling del contexto, no del submit.
 */
function crearGeneracionCompletada(
  respuesta: RespuestaPlanSemanalV2FE,
): GeneracionPlanIaFE {
  return {
    id: 501,
    socioId: 42,
    nutricionistaId: 1,
    gimnasioId: 1,
    planAlimentacionId: respuesta.planAlimentacionId,
    estado: 'COMPLETADO',
    proveedorActual: 'gemini',
    mensajeEstado: null,
    errorMensaje: null,
    respuestaJson: respuesta,
    progresoActual: 35,
    progresoTotal: 35,
    diaActual: null,
    comidaActual: null,
    snapshotParcialJson: null,
    creadoEn: '2026-06-25T10:00:00.000Z',
    actualizadoEn: '2026-06-25T10:05:00.000Z',
    iniciadoEn: '2026-06-25T10:00:05.000Z',
    finalizadoEn: '2026-06-25T10:05:00.000Z',
  };
}

/**
 * Handlers de los endpoints que pollea el contexto: la generación activa del
 * socio y el seguimiento por ID que el contexto engancha al detectarla.
 */
function mockGeneracionActiva(generacion: GeneracionPlanIaFE | null) {
  const cuerpo = {
    success: true,
    message: 'Datos obtenidos correctamente',
    data: generacion,
    meta: null,
    errors: [],
  };
  return [
    http.get('/ia/plan-semanal/generaciones/activa', () =>
      HttpResponse.json(cuerpo),
    ),
    http.get('/ia/plan-semanal/generaciones/:generacionId', () =>
      HttpResponse.json(cuerpo),
    ),
  ];
}

function crearRespuestaV2(): RespuestaPlanSemanalV2FE {
  const plan: PlanAlimentacionDatosJsonFE = {
    estructura: [
      {
        dia: 'LUNES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              {
                nombre: 'Avena con frutas',
                alimentos: [
                  { alimentoId: 1, cantidad: 100, unidad: 'g' },
                  { alimentoId: 2, cantidad: 50, unidad: 'g' },
                ],
                calorias: 350,
                proteinas: 15,
                carbohidratos: 50,
                grasas: 10,
              },
              {
                nombre: 'Tostadas con palta',
                alimentos: [
                  { alimentoId: 3, cantidad: 60, unidad: 'g' },
                  { alimentoId: 4, cantidad: 30, unidad: 'g' },
                ],
                calorias: 380,
                proteinas: 12,
                carbohidratos: 45,
                grasas: 15,
              },
            ],
          },
          {
            tipo: 'ALMUERZO',
            alternativas: [
              {
                nombre: 'Pollo grillado',
                alimentos: [{ alimentoId: 5, cantidad: 200, unidad: 'g' }],
                calorias: 650,
                proteinas: 50,
                carbohidratos: 60,
                grasas: 20,
              },
            ],
          },
        ],
      },
      {
        dia: 'MARTES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              {
                nombre: 'Yogurt con granola',
                alimentos: [{ alimentoId: 6, cantidad: 150, unidad: 'g' }],
                calorias: 320,
                proteinas: 14,
                carbohidratos: 40,
                grasas: 9,
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
      },
      MARTES: {
        calorias: 1800,
        proteinas: 80,
        carbohidratos: 220,
        grasas: 50,
      },
    } as unknown as PlanAlimentacionDatosJsonFE['macrosPorDia'],
    razonamientoCumplimiento: {
      restriccionesCumplidas: [
        {
          restriccion: 'vegano',
          detalle: 'Ningún alimento contiene carne, lácteos, huevos ni miel.',
        },
      ],
      restriccionesNoCumplidas: [
        {
          restriccion: 'sin gluten',
          detalle: 'Incluye avena que puede contener trazas.',
          comida: 'DESAYUNO',
        },
      ],
    },
  };

  return {
    planAlimentacionId: 99,
    versionId: 1,
    numeroVersion: 1,
    plan,
    validacion: {
      restriccionesCumplidas: plan.razonamientoCumplimiento.restriccionesCumplidas,
      restriccionesNoCumplidas: plan.razonamientoCumplimiento.restriccionesNoCumplidas,
      advertencias: [],
    },
    macros: {
      cumpleEstructura: true,
      diasFaltantes: [],
      comidasFaltantes: [],
      advertencias: [],
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
        MARTES: {
          calorias: 1800,
          proteinas: 80,
          carbohidratos: 220,
          grasas: 50,
          desvioPorcentaje: -10,
          banda: 'ROJO',
          detallePorMacro: {
            calorias: { real: 1800, objetivo: 2000, desvio: -10, banda: 'ROJO' },
            proteinas: { real: 80, objetivo: 100, desvio: -20, banda: 'ROJO' },
            carbohidratos: { real: 220, objetivo: 250, desvio: -12, banda: 'ROJO' },
            grasas: { real: 50, objetivo: 60, desvio: -16.67, banda: 'ROJO' },
          },
        },
      },
      bandaGlobal: 'AMARILLO',
      puedeAceptar: false,
    },
    advertencias: [],
  };
}

function crearFichaPaciente(): FichaSaludSocio {
  return {
    socioId: 42,
    fichaSaludId: 7,
    altura: 170,
    peso: 72,
    nivelActividadFisica: 'MODERADO',
    alergias: [],
    patologias: [],
    objetivoPersonal: 'Mejorar hábitos alimentarios',
    medicacionActual: null,
    suplementosActuales: null,
    cirugiasPrevias: null,
    antecedentesFamiliares: null,
    frecuenciaComidas: null,
    consumoAguaDiario: null,
    restriccionesAlimentarias: null,
    consumoAlcohol: null,
    fumaTabaco: false,
    horasSueno: null,
    contactoEmergenciaNombre: null,
    contactoEmergenciaTelefono: null,
    completada: true,
    completadaAt: new Date('2026-06-01T12:00:00.000Z'),
    actualizadaAt: new Date('2026-06-01T12:00:00.000Z'),
    consentAt: new Date('2026-06-01T12:00:00.000Z'),
    versionActual: 1,
  };
}

describe('PlanEditorPage (Packet 5b)', () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    authMock.token = 'mock-token';
    authMock.personaId = 1;
    authMock.gimnasioId = 1;
    authMock.rol = 'NUTRICIONISTA';
    authMock.permissions = ['PLANES_IA_GENERAR'];
    authMock.isAuthenticated = true;

    // Default: endpoint de pacientes vacío (no encuentra paciente)
    server.use(
      ...mockGeneracionActiva(null),
      http.get('/turnos/profesional/1/pacientes', () =>
        HttpResponse.json({ data: [], meta: { total: 0 } }),
      ),
      http.get('/turnos/profesional/1/pacientes/42/ficha-salud', () =>
        HttpResponse.json(crearFichaPaciente()),
      ),
      http.get('/planes-alimentacion/socio/42', () =>
        HttpResponse.json({
          success: true,
          message: 'Datos obtenidos correctamente',
          data: [],
          meta: null,
          errors: [],
        }),
      ),
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({
          preferencias: 'Priorizar fibra y proteínas',
        }),
      ),
    );
  });

  it('bloquea el editor completo para roles sin acceso clínico', async () => {
    authMock.rol = 'RECEPCIONISTA';

    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    expect(
      await screen.findByText(/No tenés permisos para editar planes/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('plan-editor-layout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('generar-plan-button')).not.toBeInTheDocument();
  });

  it('si el paciente no pertenece al nutricionista, no lo trata como ficha ausente', async () => {
    server.use(
      http.get('/turnos/profesional/1/pacientes/42/ficha-salud', () =>
        HttpResponse.json(
          { error: { message: 'Paciente no encontrado' } },
          { status: 404 },
        ),
      ),
    );

    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    expect(
      await screen.findByText(/No tenés acceso a este paciente/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/El paciente aún no completó su ficha/i),
    ).not.toBeInTheDocument();
  });

  it('entra directo a la grilla vacía y expone el generador IA en el header', async () => {
    const user = userEvent.setup();
    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    // La grilla se muestra sin pasar por una pantalla intermedia de opciones
    expect(await screen.findByTestId('grilla-manual-slots')).toBeInTheDocument();

    // El formulario de generación vive en el diálogo que abre el header
    expect(screen.queryByTestId('generar-plan-button')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('abrir-generador-ia-btn'));
    expect(await screen.findByTestId('generar-plan-button')).toBeInTheDocument();

    // Botón flotante de feedback NO está visible todavía (no hay plan generado)
    expect(
      screen.queryByTestId('feedback-floating-button'),
    ).not.toBeInTheDocument();
  });

  it('no crea el plan al entrar: lo crea recién al guardar y publicar', async () => {
    let crearManualLlamado = 0;
    server.use(
      http.post('/planes-alimentacion/crear-manual/42', () => {
        crearManualLlamado += 1;
        return HttpResponse.json({
          success: true,
          message: 'Creado correctamente',
          data: crearRespuestaV2(),
          meta: null,
          errors: [],
        });
      }),
      http.post('/planes-alimentacion/99/guardar-version', () =>
        HttpResponse.json({
          success: true,
          message: 'Creado correctamente',
          data: crearRespuestaV2(),
          meta: null,
          errors: [],
        }),
      ),
    );

    const user = userEvent.setup();
    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    expect(await screen.findByTestId('grilla-manual-slots')).toBeInTheDocument();
    expect(crearManualLlamado).toBe(0);

    await user.click(screen.getByTestId('guardar-version-btn'));

    await waitFor(() => {
      expect(crearManualLlamado).toBe(1);
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Versión guardada y publicada',
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('al entrar directo carga un plan editable existente y no crea otro manual', async () => {
    let crearManualLlamado = false;
    server.use(
      http.get('/planes-alimentacion/socio/42', () =>
        HttpResponse.json({
          success: true,
          message: 'Datos obtenidos correctamente',
          data: [
            {
              idPlanAlimentacion: 99,
              fechaCreacion: '2026-06-29',
              objetivoNutricional: 'Plan de alimentación manual',
              activo: false,
              eliminadoEn: null,
              motivoEliminacion: null,
              motivoEdicion: null,
              ultimaEdicion: null,
              socioId: 42,
              nutricionistaId: 1,
              dias: [],
            },
          ],
          meta: null,
          errors: [],
        }),
      ),
      http.get('/planes-alimentacion/99/versiones', () =>
        HttpResponse.json({
          success: true,
          message: 'Datos obtenidos correctamente',
          data: [
            {
              id: 7,
              numeroVersion: 1,
              motivoCambio: 'creacion_inicial',
              activa: true,
              createdAt: '2026-06-29T12:00:00.000Z',
              createdBy: 1,
            },
          ],
          meta: null,
          errors: [],
        }),
      ),
      http.get('/planes-alimentacion/version/7', () =>
        HttpResponse.json({
          success: true,
          message: 'Datos obtenidos correctamente',
          data: {
            id: 7,
            planAlimentacionId: 99,
            numeroVersion: 1,
            motivoCambio: 'creacion_inicial',
            activa: true,
            createdAt: '2026-06-29T12:00:00.000Z',
            createdBy: 1,
            datosJson: crearRespuestaV2().plan,
          },
          meta: null,
          errors: [],
        }),
      ),
      http.post('/planes-alimentacion/crear-manual/42', () => {
        crearManualLlamado = true;
        return HttpResponse.json({
          success: true,
          message: 'Creado correctamente',
          data: crearRespuestaV2(),
          meta: null,
          errors: [],
        });
      }),
    );

    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    expect(await screen.findByTestId('grilla-manual-slots')).toBeInTheDocument();
    expect(crearManualLlamado).toBe(false);
  });

  it('al completarse la generación IA muestra grilla V2 + razonamiento + botón feedback', async () => {
    server.use(
      ...mockGeneracionActiva(crearGeneracionCompletada(crearRespuestaV2())),
      http.get('/planes-alimentacion/99/versiones', () =>
        HttpResponse.json({ versiones: [] }),
      ),
    );

    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    // Razonamiento de cumplimiento visible con el resultado de la generación
    await waitFor(() => {
      expect(screen.getByText(/vegano/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/sin gluten/i)).toBeInTheDocument();

    // La grilla queda montada una vez que terminó de cargarse el borrador
    await waitFor(() => {
      expect(screen.queryByText(/Cargando borrador del plan/i)).toBeNull();
    });
    expect(screen.getByTestId('grilla-manual-slots')).toBeInTheDocument();

    // Botón flotante de feedback aparece
    expect(screen.getByTestId('feedback-floating-button')).toBeInTheDocument();
  });

  it.skip('al regenerar un día envía POST /ia/plan-semanal/regenerar con scope=DIA', async () => {
    server.use(
      http.post('/ia/plan-semanal', () =>
        HttpResponse.json(crearRespuestaV2()),
      ),
      http.post('/ia/plan-semanal/regenerar', () =>
        HttpResponse.json({
          nuevaVersionId: 2,
          numeroVersion: 2,
          motivoCambio: 'regeneracion_dia',
          cambios: { dias_modificados: ['LUNES'] },
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
          plan: crearRespuestaV2().plan,
        }),
      ),
      http.get('/planes-alimentacion/99/versiones', () =>
        HttpResponse.json({ versiones: [] }),
      ),
    );

    let peticionRegenerar: unknown = null;

    server.use(
      http.post('/ia/plan-semanal/regenerar', ({ request }) =>
        request.json().then((body) => {
          peticionRegenerar = body;
          return HttpResponse.json({
            success: true,
            message: 'Creado correctamente',
            data: {
              nuevaVersionId: 2,
              numeroVersion: 2,
              motivoCambio: 'regeneracion_dia',
              cambios: { dias_modificados: ['LUNES'] },
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
              plan: crearRespuestaV2().plan,
            },
            meta: null,
            errors: [],
          });
        }),
      ),
    );

    const user = userEvent.setup();
    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    // Generar plan
    await user.click(await screen.findByTestId('generar-plan-button'));
    await waitFor(() => {
      expect(screen.getByTestId('plan-generado-card')).toBeInTheDocument();
    });

    // Regenerar LUNES
    const botonRegenDia = screen.getByTestId('regen-dia-LUNES');
    await user.click(botonRegenDia);

    await waitFor(() => {
      expect(peticionRegenerar).toBeTruthy();
    });

    expect(peticionRegenerar).toMatchObject({
      scope: 'DIA',
      dia: 'LUNES',
      planAlimentacionVersionId: 1,
    });

    // Toast de éxito
    expect(toast.success).toHaveBeenCalledWith(
      'Plan regenerado (v2)',
      expect.objectContaining({ description: expect.any(String) }),
    );
  });

  it('abre el FeedbackModal al clickear el botón flotante', async () => {
    server.use(
      ...mockGeneracionActiva(crearGeneracionCompletada(crearRespuestaV2())),
      http.get('/planes-alimentacion/99/versiones', () =>
        HttpResponse.json({ versiones: [] }),
      ),
    );

    const user = userEvent.setup();
    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    expect(
      await screen.findByTestId('feedback-floating-button'),
    ).toBeInTheDocument();

    // Click en botón flotante abre el modal
    await user.click(screen.getByTestId('feedback-floating-button'));

    await waitFor(() => {
      expect(screen.getByText(/Tu feedback/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('feedback-positivo')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-negativo')).toBeInTheDocument();
  });

  it('muestra la VersionHistory en el sidebar cuando hay plan', async () => {
    const versionesMock: VersionPlanFE[] = [
      {
        idPlanAlimentacionVersion: 3,
        idPlanAlimentacion: 99,
        numeroVersion: 3,
        motivoCambio: 'regeneracion_dia',
        activa: false,
        createdAt: '2026-06-25T10:00:00.000Z',
        createdBy: 1,
      },
      {
        idPlanAlimentacionVersion: 1,
        idPlanAlimentacion: 99,
        numeroVersion: 1,
        motivoCambio: 'creacion_inicial',
        activa: true,
        createdAt: '2026-06-24T10:00:00.000Z',
        createdBy: 1,
      },
    ];

    server.use(
      ...mockGeneracionActiva(crearGeneracionCompletada(crearRespuestaV2())),
      http.get('/planes-alimentacion/99/versiones', () =>
        HttpResponse.json({ versiones: versionesMock }),
      ),
      http.get('/planes-alimentacion/version/:versionId', () =>
        HttpResponse.json({
          id: 1,
          planAlimentacionId: 99,
          numeroVersion: 1,
          motivoCambio: 'creacion_inicial',
          activa: true,
          createdAt: '2026-06-24T10:00:00.000Z',
          createdBy: 1,
          datosJson: crearRespuestaV2().plan,
        }),
      ),
    );

    const user = userEvent.setup();
    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    await screen.findByTestId('grilla-manual-slots');

    // Hacer click en la pestaña de Historial de versiones
    await user.click(screen.getByRole('tab', { name: /Historial de versiones/i }));

    await waitFor(() => {
      expect(screen.getAllByTestId('version-item')).toHaveLength(2);
    });
  });

  it('muestra advertencias del backend cuando las hay', async () => {
    const respuestaConAdvertencias = crearRespuestaV2();
    respuestaConAdvertencias.advertencias = [
      'Macros en MARTES fuera de rango (±10%)',
      'Estructura incompleta para SABADO',
    ];

    server.use(      ...mockGeneracionActiva(crearGeneracionCompletada(respuestaConAdvertencias)),
      http.get('/planes-alimentacion/99/versiones', () =>
        HttpResponse.json({ versiones: [] }),
      ),
    );

    render(<PlanEditorPage />, { wrapper: crearWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Advertencias \(2\)/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Macros en MARTES fuera de rango/i),
    ).toBeInTheDocument();
  });
});
