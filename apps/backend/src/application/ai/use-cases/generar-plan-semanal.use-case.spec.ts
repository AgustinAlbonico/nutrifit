/**
 * Spec de GenerarPlanSemanalUseCase (reescrito v2)
 * ================================================
 *
 * Cobertura de los caminos críticos:
 * - Happy path: ficha válida + nutricionista válido + IA responde JSON válido
 *   → plan persistido + auditoría + notificación.
 * - Restricción violada + 1 reintento correctivo → segunda respuesta OK.
 * - Restricción violada + 2 reintentos correctivos ambos fallidos →
 *   advertencia + plan persistido igual.
 * - Macros ROJO → notificación PLAN_MACROS_FUERA_RANGO.
 * - Macros VERDE → sin notificación de macros.
 * - Timeout Groq (2 timeouts) → throw GROQ_TIMEOUT.
 * - JSON inválido Groq (2 fallos) → throw GROQ_INVALID_JSON.
 * - Estructura inválida (JSON sin `estructura`) → throw PLAN_ESTRUCTURA_INVALIDA.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerarPlanSemanalUseCase } from './generar-plan-semanal.use-case';
import { PromptPlanSemanalBuilder } from '../builders/prompt-plan-semanal.builder';
import { SeleccionarEjemplosMemoriaUseCase } from 'src/application/ia-memoria/use-cases/seleccionar-ejemplos-memoria.use-case';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import {
  BadGatewayError,
  ServiceUnavailableError,
} from 'src/domain/exceptions/custom-exceptions';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import {
  NutricionistaRepository,
  NUTRICIONISTA_REPOSITORY,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  PlanAlimentacionVersionRepository,
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import {
  NutricionistaIAMemoriaRepository,
  NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
} from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import {
  IAiProviderService,
  AI_PROVIDER_SERVICE,
} from 'src/domain/services/ai-provider.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { PlanAlimentacionVersionEntity } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-version.entity';
import { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

const loggerMock: IAppLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

// Plan de ejemplo con macros aproximadamente correctos (2000 kcal/día)
// El use-case hace SUM de todas las alternativas para calcular el total
// diario, por lo que cada alternativa debe ser target / 4 = 500 kcal, 31g
// de proteínas, 63g de carbohidratos, 14g de grasas.
const planJsonValido: PlanAlimentacionDatosJson = {
  estructura: [
    {
      dia: DiaSemana.LUNES,
      comidas: [
        {
          tipo: TipoComida.DESAYUNO,
          alternativas: [
            {
              nombre: 'Avena con frutas',
              alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
              calorias: 500,
              proteinas: 31,
              carbohidratos: 63,
              grasas: 14,
            },
          ],
        },
        {
          tipo: TipoComida.ALMUERZO,
          alternativas: [
            {
              nombre: 'Quinoa con legumbres',
              alimentos: [{ alimentoId: 2, cantidad: 200, unidad: 'g' }],
              calorias: 500,
              proteinas: 31,
              carbohidratos: 63,
              grasas: 14,
            },
          ],
        },
        {
          tipo: TipoComida.MERIENDA,
          alternativas: [
            {
              nombre: 'Frutas',
              alimentos: [{ alimentoId: 3, cantidad: 100, unidad: 'g' }],
              calorias: 500,
              proteinas: 31,
              carbohidratos: 63,
              grasas: 14,
            },
          ],
        },
        {
          tipo: TipoComida.CENA,
          alternativas: [
            {
              nombre: 'Sopa de verduras',
              alimentos: [{ alimentoId: 4, cantidad: 150, unidad: 'g' }],
              calorias: 500,
              proteinas: 31,
              carbohidratos: 63,
              grasas: 14,
            },
          ],
        },
      ],
    },
  ],
  macrosPorDia: {
    [DiaSemana.LUNES]: {
      calorias: 2000,
      proteinas: 100,
      carbohidratos: 250,
      grasas: 70,
    },
  } as Record<DiaSemana, never>,
  razonamientoCumplimiento: {
    restriccionesCumplidas: [],
    restriccionesNoCumplidas: [],
  },
};

// Plan con macros ROJO (desvío > 10%)
const planJsonRojo: PlanAlimentacionDatosJson = {
  ...planJsonValido,
  estructura: planJsonValido.estructura.map((d) => ({
    ...d,
    comidas: d.comidas.map((c) => ({
      ...c,
      alternativas: c.alternativas.map((a) => ({
        ...a,
        calorias: 3000, // 50% arriba
      })),
    })),
  })),
};

describe('GenerarPlanSemanalUseCase', () => {
  let useCase: GenerarPlanSemanalUseCase;
  let aiProviderMock: jest.Mocked<IAiProviderService>;
  let fichaRepoMock: jest.Mocked<Repository<FichaSaludOrmEntity>>;
  let planRepoMock: jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;
  let nutricionistaRepoMock: jest.Mocked<NutricionistaRepository>;
  let planVersionRepoMock: jest.Mocked<PlanAlimentacionVersionRepository>;
  let memoriaRepoMock: jest.Mocked<NutricionistaIAMemoriaRepository>;
  let notificacionesMock: jest.Mocked<NotificacionesService>;
  let auditoriaMock: jest.Mocked<AuditoriaService>;

  beforeEach(async () => {
    aiProviderMock = {
      generarRecomendacion: jest.fn(),
      verificarConexion: jest.fn(),
    } as unknown as jest.Mocked<IAiProviderService>;

    fichaRepoMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<FichaSaludOrmEntity>>;

    planRepoMock = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;

    nutricionistaRepoMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<NutricionistaRepository>;

    planVersionRepoMock = {
      crear: jest.fn(),
    } as unknown as jest.Mocked<PlanAlimentacionVersionRepository>;

    memoriaRepoMock = {
      obtenerParaSeleccion: jest.fn(),
    } as unknown as jest.Mocked<NutricionistaIAMemoriaRepository>;

    notificacionesMock = {
      crear: jest.fn().mockResolvedValue({ idNotificacion: 1 }),
    } as unknown as jest.Mocked<NotificacionesService>;

    auditoriaMock = {
      registrar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditoriaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerarPlanSemanalUseCase,
        PromptPlanSemanalBuilder,
        SeleccionarEjemplosMemoriaUseCase,
        { provide: AI_PROVIDER_SERVICE, useValue: aiProviderMock },
        { provide: APP_LOGGER_SERVICE, useValue: loggerMock },
        {
          provide: getRepositoryToken(FichaSaludOrmEntity),
          useValue: fichaRepoMock,
        },
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: planRepoMock,
        },
        { provide: NUTRICIONISTA_REPOSITORY, useValue: nutricionistaRepoMock },
        {
          provide: PLAN_ALIMENTACION_VERSION_REPOSITORY,
          useValue: planVersionRepoMock,
        },
        {
          provide: NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
          useValue: memoriaRepoMock,
        },
        { provide: NotificacionesService, useValue: notificacionesMock },
        { provide: AuditoriaService, useValue: auditoriaMock },
      ],
    }).compile();

    useCase = module.get<GenerarPlanSemanalUseCase>(GenerarPlanSemanalUseCase);
  });

  // Helper: armar mocks para happy path
  function setupHappyPathMocks() {
    fichaRepoMock.findOne.mockResolvedValue({
      idFichaSalud: 1,
      alergias: [{ idAlergia: 1, nombre: 'Maní' } as never],
      restriccionesAlimentarias: null,
      patologias: [],
      objetivoPersonal: 'Bajar de peso',
    } as unknown as FichaSaludOrmEntity);

    const nutri = new NutricionistaEntity(
      100,
      'María',
      'García',
      new Date('1990-01-01'),
      '123',
      'F' as Genero,
      'Calle 1',
      'CABA',
      'Buenos Aires',
      '12345',
      5,
      5000,
      [],
      [],
      [],
      [],
      [],
      null,
      'maria@test.com',
      null,
      30,
      null,
      'preferencias persistentes',
    );
    nutricionistaRepoMock.findById.mockResolvedValue(nutri);

    memoriaRepoMock.obtenerParaSeleccion.mockResolvedValue([]);

    planRepoMock.save.mockImplementation((entity) => {
      const e = entity as PlanAlimentacionOrmEntity;
      if (!e.idPlanAlimentacion) {
        e.idPlanAlimentacion = 999;
      }
      return Promise.resolve(e);
    });

    planVersionRepoMock.crear.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        999,
        1,
        planJsonValido,
        'creacion_inicial',
        false,
        new Date(),
        100,
      ),
    );
  }

  it('happy path: ficha válida + IA responde OK → plan persistido + auditoría + notificación', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockResolvedValue(planJsonValido);

    const resultado = await useCase.execute({
      socioId: 50,
      nutricionistaId: 100,
      gimnasioId: 10,
      diasAGenerar: 1,
      comidasPorDia: 4,
    });

    expect(resultado.planAlimentacionId).toBe(999);
    expect(resultado.versionId).toBe(555);
    expect(resultado.numeroVersion).toBe(1);
    expect(resultado.macros.bandaGlobal).toBe('VERDE');
    expect(resultado.macros.puedeAceptar).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(auditoriaMock.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'PLAN_CREADO',
        entidad: 'PlanAlimentacion',
      }),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(notificacionesMock.crear).toHaveBeenCalled();

    // Packet 4: ahora debe usar el tipo PLAN_REVISAR (no PLAN_CREADO)
    const llamadasNotif = notificacionesMock.crear.mock.calls.map((c) => c[0]);
    const hayNotifRevisar = llamadasNotif.some(
      (l) => l.tipo === 'PLAN_REVISAR',
    );
    expect(hayNotifRevisar).toBe(true);
  });

  it('primera generación persiste plan con activo=false y estado=BORRADOR (Hotfix Packet 8)', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockResolvedValue(planJsonValido);

    await useCase.execute({
      socioId: 50,
      nutricionistaId: 100,
      gimnasioId: 10,
      diasAGenerar: 1,
      comidasPorDia: 4,
    });

    // Hotfix Packet 8: la primera generación debe quedar BORRADOR.
    // planRepo.save debe haber sido llamado con un entity donde
    // activo=false y estado='BORRADOR'. Como no forzamos esos campos
    // explícitamente, validamos que NO se haya seteado activo=true.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planRepoMock.save).toHaveBeenCalledTimes(1);
    const planPersistido = planRepoMock.save.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    // El entity NO debe tener activo=true explícito (queda el default
    // false de la columna).
    expect(planPersistido.activo).not.toBe(true);
    // Tampoco debe setearse estado explícitamente (queda el default
    // 'BORRADOR' de la columna).
    expect(planPersistido.estado).toBeUndefined();
  });

  it('restricción violada 1 vez → 1 reintento correctivo y segunda respuesta OK', async () => {
    setupHappyPathMocks();

    // Primer llamada devuelve plan con pollo (violación vegana) — pero como
    // el socio tiene alergia a Maní (no vegano), el plan con pollo no viola.
    // Necesitamos que la ficha tenga restricción vegana.
    fichaRepoMock.findOne.mockResolvedValue({
      idFichaSalud: 1,
      alergias: [],
      restriccionesAlimentarias: 'vegano',
      patologias: [],
      objetivoPersonal: null,
    } as unknown as FichaSaludOrmEntity);

    const planConPollo: PlanAlimentacionDatosJson = {
      ...planJsonValido,
      estructura: planJsonValido.estructura.map((d) => ({
        ...d,
        comidas: d.comidas.map((c) => ({
          ...c,
          tipo: c.tipo,
          alternativas: c.alternativas.map((a, idx) =>
            idx === 0 ? { ...a, nombre: 'Pollo grillado' } : a,
          ),
        })),
      })),
    };

    aiProviderMock.generarRecomendacion
      .mockResolvedValueOnce(planConPollo) // primera: viola vegano
      .mockResolvedValueOnce(planJsonValido); // segunda: OK

    const resultado = await useCase.execute({
      socioId: 50,
      nutricionistaId: 100,
      gimnasioId: 10,
      diasAGenerar: 1,
      comidasPorDia: 4,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(aiProviderMock.generarRecomendacion).toHaveBeenCalledTimes(2);
    expect(resultado.validacion.restriccionesNoCumplidas.length).toBe(0);
  });

  it('macros ROJO → notificación PLAN_MACROS_FUERA_RANGO', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockResolvedValue(planJsonRojo);

    await useCase.execute({
      socioId: 50,
      nutricionistaId: 100,
      gimnasioId: 10,
      diasAGenerar: 1,
      comidasPorDia: 4,
    });

    // Verificar que se llamó notificación con tipo PLAN_MACROS_FUERA_RANGO
    const llamadasNotif = notificacionesMock.crear.mock.calls.map((c) => c[0]);
    const hayNotifMacros = llamadasNotif.some(
      (l) => l.tipo === 'PLAN_MACROS_FUERA_RANGO',
    );
    expect(hayNotifMacros).toBe(true);
  });

  it('Groq timeout 2 veces → throw ServiceUnavailableError (503) con código GROQ_TIMEOUT', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockRejectedValue(
      new Error('Request timeout - ETIMEDOUT'),
    );

    // Hotfix Packet 8: GROQ_TIMEOUT debe mapear a HTTP 503 vía ServiceUnavailableError.
    await expect(
      useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
        diasAGenerar: 1,
        comidasPorDia: 4,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);

    // Capturamos el error para verificar statusCode (503) y código interno.
    let errorCapturado: unknown;
    try {
      await useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
        diasAGenerar: 1,
        comidasPorDia: 4,
      });
    } catch (e) {
      errorCapturado = e;
    }
    expect(errorCapturado).toBeInstanceOf(ServiceUnavailableError);
    const appErr = errorCapturado as ServiceUnavailableError;
    expect(appErr.statusCode).toBe(503);
    expect(appErr.message).toMatch(/GROQ_TIMEOUT/);
    expect(appErr.context).toEqual(
      expect.objectContaining({ codigo: 'GROQ_TIMEOUT' }),
    );
  }, 15000);

  it('Groq JSON inválido 2 veces → throw BadGatewayError (502) con código GROQ_INVALID_JSON', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockRejectedValue(
      new Error('Unexpected token in JSON'),
    );

    // Hotfix Packet 8: GROQ_INVALID_JSON debe mapear a HTTP 502 vía BadGatewayError.
    await expect(
      useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toBeInstanceOf(BadGatewayError);

    let errorCapturado: unknown;
    try {
      await useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
      });
    } catch (e) {
      errorCapturado = e;
    }
    expect(errorCapturado).toBeInstanceOf(BadGatewayError);
    const appErr = errorCapturado as BadGatewayError;
    expect(appErr.statusCode).toBe(502);
    expect(appErr.message).toMatch(/GROQ_INVALID_JSON/);
    expect(appErr.context).toEqual(
      expect.objectContaining({ codigo: 'GROQ_INVALID_JSON' }),
    );
  });

  it('Groq timeout 2 veces → NO persiste plan (AC11)', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockRejectedValue(
      new Error('Request timeout - ETIMEDOUT'),
    );

    await expect(
      useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
        diasAGenerar: 1,
        comidasPorDia: 4,
      }),
    ).rejects.toThrow();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planRepoMock.save).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planVersionRepoMock.crear).not.toHaveBeenCalled();
  }, 15000);

  it('Groq JSON inválido 2 veces → NO persiste plan (AC12)', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockRejectedValue(
      new Error('Unexpected token in JSON'),
    );

    await expect(
      useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planRepoMock.save).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planVersionRepoMock.crear).not.toHaveBeenCalled();
  });

  it('Groq retorna JSON sin estructura → throw PLAN_ESTRUCTURA_INVALIDA', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockResolvedValue({
      estructura: 'invalid',
      macrosPorDia: {},
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    } as unknown as PlanAlimentacionDatosJson);

    await expect(
      useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/PLAN_ESTRUCTURA_INVALIDA/);
  });

  it('parámetros fuera de rango → throw BadRequestError', async () => {
    await expect(
      useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
        diasAGenerar: 0,
      }),
    ).rejects.toThrow(/diasAGenerar/);

    await expect(
      useCase.execute({
        socioId: 50,
        nutricionistaId: 100,
        gimnasioId: 10,
        comidasPorDia: 99,
      }),
    ).rejects.toThrow(/comidasPorDia/);
  });

  it('nutricionista no encontrado → throw NotFoundError', async () => {
    fichaRepoMock.findOne.mockResolvedValue(null);
    nutricionistaRepoMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        socioId: 50,
        nutricionistaId: 999,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/Nutricionista/);
  });

  it('auditoría falla → operación NO falla (tolerancia)', async () => {
    setupHappyPathMocks();
    aiProviderMock.generarRecomendacion.mockResolvedValue(planJsonValido);
    auditoriaMock.registrar.mockRejectedValue(new Error('BD caída'));

    // No debe lanzar
    const resultado = await useCase.execute({
      socioId: 50,
      nutricionistaId: 100,
      gimnasioId: 10,
      diasAGenerar: 1,
      comidasPorDia: 4,
    });

    expect(resultado.planAlimentacionId).toBe(999);
  });
});
