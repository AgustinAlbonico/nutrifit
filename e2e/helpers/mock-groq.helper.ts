import { Page, Route } from '@playwright/test';
import type { FichaClinicaFixture } from '../fixtures/socios-con-restricciones.fixture';

/**
 * Helper para mockear las llamadas a la IA en los tests E2E.
 *
 * ## Nota arquitectónica
 *
 * En esta arquitectura, la llamada a Groq se hace desde el BACKEND (NestJS),
 * NO desde el frontend. Esto significa que page.route contra el dominio
 * de Groq NO intercepta la llamada real — el request nunca pasa por el browser.
 *
 * La estrategia correcta para E2E determinístico es mockear la respuesta del
 * BACKEND (/ia/plan-semanal, /ia/plan-semanal/regenerar) que es la única
 * llamada HTTP que el frontend hace al backend en este flujo.
 *
 * Si en el futuro la arquitectura cambia a que el FE llame directamente a Groq,
 * este helper debe actualizarse para interceptar las llamadas al dominio Groq
 * en su lugar. La función mockGroqEndpoint mantiene el nombre solicitado por el
 * task spec para conservar la trazabilidad del diseño original.
 */

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type DiaSemana =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

export type TipoComida = 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'SNACK';

export type BandaMacro = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface ItemComidaSnapshot {
  nombre: string;
  alimentos: Array<{ alimentoId: number; cantidad: number; unidad: string }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export interface PlanAlimentacionDatosJsonMock {
  estructura: Array<{
    dia: DiaSemana;
    comidas: Array<{
      tipo: TipoComida;
      alternativas: ItemComidaSnapshot[];
    }>;
  }>;
  macrosPorDia: Record<
    DiaSemana,
    {
      calorias: number;
      proteinas: number;
      carbohidratos: number;
      grasas: number;
      desvioPorcentaje: number;
      banda: BandaMacro;
      detallePorMacro: Record<
        'calorias' | 'proteinas' | 'carbohidratos' | 'grasas',
        { real: number; objetivo: number; desvio: number; banda: BandaMacro }
      >;
    }
  >;
  razonamientoCumplimiento: {
    restriccionesCumplidas: Array<{ restriccion: string; detalle: string }>;
    restriccionesNoCumplidas: Array<{
      restriccion: string;
      detalle: string;
      comida?: string;
      alternativa?: number;
      alimento?: string;
    }>;
  };
}

export interface RespuestaGenerarPlanMock {
  planAlimentacionId: number;
  versionId: number;
  numeroVersion: number;
  plan: PlanAlimentacionDatosJsonMock;
  validacion: {
    restriccionesCumplidas: Array<{ restriccion: string; detalle: string }>;
    restriccionesNoCumplidas: Array<{
      restriccion: string;
      detalle: string;
      comida?: string;
    }>;
    advertencias: string[];
  };
  macros: {
    cumpleEstructura: boolean;
    diasFaltantes: DiaSemana[];
    macrosPorDia: PlanAlimentacionDatosJsonMock['macrosPorDia'];
    bandaGlobal: BandaMacro;
    puedeAceptar: boolean;
  };
  advertencias: string[];
}

export interface RespuestaRegenerarPlanMock {
  nuevaVersionId: number;
  numeroVersion: number;
  motivoCambio: 'regeneracion_completa' | 'regeneracion_dia' | 'regeneracion_alternativa';
  cambios: {
    dias_modificados?: DiaSemana[];
    comidas_modificadas?: Array<{ dia: DiaSemana; slot: TipoComida; alternativa: number }>;
  };
  validacion: RespuestaGenerarPlanMock['validacion'];
  macros: RespuestaGenerarPlanMock['macros'];
  plan: PlanAlimentacionDatosJsonMock;
}

// ─── Generadores de planes ─────────────────────────────────────────────────

const TODOS_LOS_DIAS: DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

const TODAS_LAS_COMIDAS: TipoComida[] = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA'];

/**
 * Genera un plan base con la estructura solicitada (7 días x 4 comidas x 3 alternativas).
 * Las calorías por comida se ajustan al objetivo del perfil.
 */
function generarPlanBase(
  ficha: FichaClinicaFixture,
  opciones: {
    dias?: number;
    comidas?: number;
    alternativas?: number;
    /** Override de banda para testear macros amarillo/rojo */
    forzarBanda?: BandaMacro;
  } = {},
): PlanAlimentacionDatosJsonMock {
  const dias = opciones.dias ?? 7;
  const comidas = opciones.comidas ?? 4;
  const alternativas = opciones.alternativas ?? 3;
  const bandaForzada = opciones.forzarBanda;

  const caloriasPorComida = Math.round(ficha.objetivoCalorias / comidas);

  const estructura = TODOS_LOS_DIAS.slice(0, dias).map((dia) => ({
    dia,
    comidas: TODAS_LAS_COMIDAS.slice(0, comidas).map((tipo, idxTipo) => ({
      tipo,
      alternativas: Array.from({ length: alternativas }, (_, idxAlt) => ({
        nombre: `${tipo} opción ${idxAlt + 1} — ${dia.toLowerCase()}`,
        alimentos: [
          {
            alimentoId: 1000 + idxTipo * 10 + idxAlt,
            cantidad: 100,
            unidad: 'g',
          },
        ],
        calorias: caloriasPorComida,
        proteinas: Math.round(caloriasPorComida * 0.25) / 4,
        carbohidratos: Math.round(caloriasPorComida * 0.5) / 4,
        grasas: Math.round(caloriasPorComida * 0.25) / 9,
      })),
    })),
  }));

  // Determinar banda por día (uniforme o forzada)
  const macrosPorDia = {} as PlanAlimentacionDatosJsonMock['macrosPorDia'];
  TODOS_LOS_DIAS.slice(0, dias).forEach((dia) => {
    const desvio = bandaForzada === 'ROJO' ? 12 : bandaForzada === 'AMARILLO' ? 7 : 1;
    macrosPorDia[dia] = {
      calorias: ficha.objetivoCalorias,
      proteinas: 100,
      carbohidratos: 250,
      grasas: 70,
      desvioPorcentaje: desvio,
      banda: bandaForzada ?? 'VERDE',
      detallePorMacro: {
        calorias: { real: ficha.objetivoCalorias, objetivo: ficha.objetivoCalorias, desvio, banda: bandaForzada ?? 'VERDE' },
        proteinas: { real: 100, objetivo: 100, desvio, banda: bandaForzada ?? 'VERDE' },
        carbohidratos: { real: 250, objetivo: 250, desvio, banda: bandaForzada ?? 'VERDE' },
        grasas: { real: 70, objetivo: 70, desvio, banda: bandaForzada ?? 'VERDE' },
      },
    };
  });

  return {
    estructura,
    macrosPorDia,
    razonamientoCumplimiento: {
      restriccionesCumplidas: [],
      restriccionesNoCumplidas: [],
    },
  };
}

/**
 * Enriquece el plan con las restricciones cumplidas según el perfil.
 */
function aplicarRestricciones(
  plan: PlanAlimentacionDatosJsonMock,
  ficha: FichaClinicaFixture,
): PlanAlimentacionDatosJsonMock {
  const cumplidas: Array<{ restriccion: string; detalle: string }> = [];

  if (
    ficha.restriccionesAlimentarias?.toLowerCase().includes('vegano') ||
    ficha.restriccionesAlimentarias?.toLowerCase().includes('sin carne')
  ) {
    cumplidas.push({
      restriccion: 'vegano',
      detalle: 'Plan 100% vegano, sin carne, lácteos, huevos ni miel',
    });
  }
  if (
    ficha.restriccionesAlimentarias?.toLowerCase().includes('sin gluten')
  ) {
    cumplidas.push({
      restriccion: 'sin_gluten',
      detalle: 'Plan libre de gluten, sin trigo ni avena',
    });
  }
  if (ficha.patologias.includes('DIABETES_TIPO_2')) {
    cumplidas.push({
      restriccion: 'bajo_azucar',
      detalle: 'Plan con bajo índice glucémico,控制了 los hidratos de carbono refinados',
    });
  }
  if (ficha.restriccionesAlimentarias?.toLowerCase().includes('bajo en azúcar')) {
    cumplidas.push({
      restriccion: 'bajo_azucar',
      detalle: 'Plan con hidratos de carbono de bajo índice glucémico',
    });
  }

  return {
    ...plan,
    razonamientoCumplimiento: {
      ...plan.razonamientoCumplimiento,
      restriccionesCumplidas: cumplidas,
    },
  };
}

// ─── Funciones de mock ─────────────────────────────────────────────────────

/**
 * Mocks para un plan "verde" (macros en banda VERDE, todas las restricciones cumplidas).
 */
export function buildRespuestaGenerarVerde(
  ficha: FichaClinicaFixture,
  opciones: { dias?: number; comidas?: number; alternativas?: number } = {},
): RespuestaGenerarPlanMock {
  const planBase = generarPlanBase(ficha, opciones);
  const plan = aplicarRestricciones(planBase, ficha);

  return {
    planAlimentacionId: 9999,
    versionId: 1,
    numeroVersion: 1,
    plan,
    validacion: {
      restriccionesCumplidas: plan.razonamientoCumplimiento.restriccionesCumplidas,
      restriccionesNoCumplidas: [],
      advertencias: [],
    },
    macros: {
      cumpleEstructura: true,
      diasFaltantes: [],
      macrosPorDia: plan.macrosPorDia,
      bandaGlobal: 'VERDE',
      puedeAceptar: true,
    },
    advertencias: [],
  };
}

/**
 * Mocks para un plan con macros en banda AMARILLA (advertencia, plan persiste igual).
 */
export function buildRespuestaGenerarAmarillo(
  ficha: FichaClinicaFixture,
): RespuestaGenerarPlanMock {
  const planBase = generarPlanBase(ficha, { forzarBanda: 'AMARILLO' });
  const plan = aplicarRestricciones(planBase, ficha);

  return {
    planAlimentacionId: 9998,
    versionId: 1,
    numeroVersion: 1,
    plan,
    validacion: {
      restriccionesCumplidas: plan.razonamientoCumplimiento.restriccionesCumplidas,
      restriccionesNoCumplidas: [],
      advertencias: ['Macros en banda AMARILLA en 2 días'],
    },
    macros: {
      cumpleEstructura: true,
      diasFaltantes: [],
      macrosPorDia: plan.macrosPorDia,
      bandaGlobal: 'AMARILLO',
      puedeAceptar: false,
    },
    advertencias: ['Macros en banda AMARILLA en 2 días'],
  };
}

/**
 * Mocks para una respuesta de regeneración de alternativa.
 */
export function buildRespuestaRegenerarAlternativa(
  ficha: FichaClinicaFixture,
  cambios: { dia: DiaSemana; slot: TipoComida; alternativa: number },
  versionAnterior: number,
): RespuestaRegenerarPlanMock {
  const planBase = generarPlanBase(ficha);
  const plan = aplicarRestricciones(planBase, ficha);

  // Sobrescribir el nombre de la alternativa regenerada para que diff sea visible
  const diaIdx = TODOS_LOS_DIAS.indexOf(cambios.dia);
  const comidaIdx = TODAS_LAS_COMIDAS.indexOf(cambios.slot);
  if (
    diaIdx >= 0 &&
    comidaIdx >= 0 &&
    plan.estructura[diaIdx]?.comidas[comidaIdx]?.alternativas[cambios.alternativa]
  ) {
    plan.estructura[diaIdx].comidas[comidaIdx].alternativas[cambios.alternativa].nombre =
      'Opción regenerada por IA';
    plan.estructura[diaIdx].comidas[comidaIdx].alternativas[cambios.alternativa].calorias += 50;
  }

  return {
    nuevaVersionId: versionAnterior + 1,
    numeroVersion: versionAnterior + 1,
    motivoCambio: 'regeneracion_alternativa',
    cambios: {
      comidas_modificadas: [cambios],
    },
    validacion: {
      restriccionesCumplidas: plan.razonamientoCumplimiento.restriccionesCumplidas,
      restriccionesNoCumplidas: [],
      advertencias: [],
    },
    macros: {
      cumpleEstructura: true,
      diasFaltantes: [],
      macrosPorDia: plan.macrosPorDia,
      bandaGlobal: 'VERDE',
      puedeAceptar: true,
    },
    plan,
  };
}

// ─── Helper principal de mocking ──────────────────────────────────────────

export interface MockGroqOptions {
  /** Plan a devolver cuando se llama a POST /ia/plan-semanal */
  respuestaGenerar?: RespuestaGenerarPlanMock;
  /** Plan a devolver cuando se llama a POST /ia/plan-semanal/regenerar */
  respuestaRegenerar?: RespuestaRegenerarPlanMock;
  /** Si se setea, fuerza un error 503 (simula timeout de Groq) */
  forzarGroq503?: boolean;
  /** Si se setea, devuelve JSON inválido (simula respuesta malformada) */
  forzarJsonInvalido?: boolean;
  /** Status code HTTP a devolver (default 201) */
  statusCode?: number;
}

/**
 * Registra mocks en la página para los endpoints de IA del backend.
 *
 * Esta función se llama en `beforeEach` para preparar las respuestas
 * determinísticas que reemplazan las llamadas reales a la IA.
 *
 * @example
 * ```ts
 * test.beforeEach(async ({ page }) => {
 *   await mockGroqEndpoint(page, {
 *     respuestaGenerar: buildRespuestaGenerarVerde(socioVeganoEstricto),
 *   });
 * });
 * ```
 */
export async function mockGroqEndpoint(
  page: Page,
  opciones: MockGroqOptions = {},
): Promise<void> {
  const {
    respuestaGenerar,
    respuestaRegenerar,
    forzarGroq503,
    forzarJsonInvalido,
    statusCode = 201,
  } = opciones;

  // Mock para POST /ia/plan-semanal
  await page.route('**/ia/plan-semanal', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      return route.continue();
    }
    const url = route.request().url();

    // Distinguir regenerar vs generar por sub-ruta
    if (url.includes('/regenerar')) {
      if (forzarGroq503) {
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 503,
            message: 'GROQ_TIMEOUT: El servicio de IA no respondió',
            error: 'Service Unavailable',
          }),
        });
      }
      if (forzarJsonInvalido) {
        return route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 502,
            message: 'GROQ_INVALID_JSON: La IA devolvió JSON inválido',
            error: 'Bad Gateway',
          }),
        });
      }
      const body = respuestaRegenerar ?? respuestaGenerar;
      if (!body) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Mock no configurado' }),
        });
      }
      return route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    }

    // POST /ia/plan-semanal (generar)
    if (forzarGroq503) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 503,
          message: 'GROQ_TIMEOUT: El servicio de IA no respondió después de 2 reintentos',
          error: 'Service Unavailable',
        }),
      });
    }
    if (forzarJsonInvalido) {
      return route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 502,
          message: 'GROQ_INVALID_JSON: La IA devolvió JSON inválido después de 2 reintentos',
          error: 'Bad Gateway',
        }),
      });
    }
    if (!respuestaGenerar) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Mock no configurado' }),
      });
    }
    return route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(respuestaGenerar),
    });
  });
}

/**
 * Helper para mockear respuestas específicas de feedback (POST/PUT feedback).
 */
export async function mockFeedbackEndpoint(
  page: Page,
  opciones: {
    /** Si true, la próxima llamada devuelve 409 (simula feedback duplicado) */
    simularDuplicado?: boolean;
  } = {},
): Promise<void> {
  const { simularDuplicado = false } = opciones;
  await page.route('**/planes-alimentacion/version/*/feedback', async (route: Route) => {
    if (simularDuplicado) {
      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 409,
          message: 'Ya votaste esta versión, usá PUT para editar',
          error: 'Conflict',
        }),
      });
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        idPlanFeedback: 1,
        idPlanAlimentacionVersion: 1,
        idNutricionista: 1,
        voto: 'POSITIVO',
        comentario: 'Feedback registrado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
  });
}

/**
 * Helper para mockear respuestas de memoria IA (GET /nutricionistai/memoria).
 */
export async function mockMemoriaEndpoint(
  page: Page,
  ejemplos: Array<{ id: number; tipoEjemplo: 'POSITIVO' | 'NEGATIVO'; comentario: string }>,
): Promise<void> {
  await page.route('**/nutricionistai/memoria', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        positivos: ejemplos.filter((e) => e.tipoEjemplo === 'POSITIVO'),
        negativos: ejemplos.filter((e) => e.tipoEjemplo === 'NEGATIVO'),
        totalActivas: ejemplos.length,
        archivadas: 0,
      }),
    });
  });
}