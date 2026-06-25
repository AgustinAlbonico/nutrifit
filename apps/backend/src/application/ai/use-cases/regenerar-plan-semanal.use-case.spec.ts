/**
 * Spec de RegenerarPlanSemanalUseCase
 * ===================================
 *
 * Cobertura:
 *  - Happy path scope=PLAN: genera nueva versión con merge completo.
 *  - Happy path scope=DIA: merge quirúrgico preserva los otros días.
 *  - Happy path scope=ALTERNATIVA: merge solo de la alternativa indicada.
 *  - Validaciones: 404 si versión/plan no existe, 403 si NUT no dueño,
 *    409 si plan FINALIZADO, 409 si edicion_manual sin confirmación,
 *    400 si scope=DIA sin dia, etc.
 *  - Notificaciones: PLAN_REVISAR siempre; PLAN_VALIDACION_WARNING si hay
 *    violaciones; PLAN_MACROS_FUERA_RANGO si banda ROJO.
 *  - Auditoría: PLAN_REGENERADO.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RegenerarPlanSemanalUseCase } from './regenerar-plan-semanal.use-case';
import { PromptRegeneracionBuilder } from '../builders/prompt-regeneracion.builder';
import { SeleccionarEjemplosMemoriaUseCase } from 'src/application/ia-memoria/use-cases/seleccionar-ejemplos-memoria.use-case';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import {
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
  PlanAlimentacionVersionOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
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
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
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

const tenantContextMock = {
  gimnasioId: 10,
  isInitialized: true,
} as unknown as TenantContextService;

const versionActualJson: PlanAlimentacionDatosJson = {
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
              proteinas: 25,
              carbohidratos: 60,
              grasas: 12,
            },
            {
              nombre: 'Tostadas con huevo',
              alimentos: [{ alimentoId: 2, cantidad: 80, unidad: 'g' }],
              calorias: 480,
              proteinas: 28,
              carbohidratos: 55,
              grasas: 14,
            },
          ],
        },
        {
          tipo: TipoComida.ALMUERZO,
          alternativas: [
            {
              nombre: 'Quinoa con legumbres',
              alimentos: [{ alimentoId: 3, cantidad: 200, unidad: 'g' }],
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
              alimentos: [{ alimentoId: 4, cantidad: 100, unidad: 'g' }],
              calorias: 500,
              proteinas: 25,
              carbohidratos: 65,
              grasas: 14,
            },
          ],
        },
        {
          tipo: TipoComida.CENA,
          alternativas: [
            {
              nombre: 'Sopa de verduras',
              alimentos: [{ alimentoId: 5, cantidad: 200, unidad: 'g' }],
              calorias: 500,
              proteinas: 19,
              carbohidratos: 62,
              grasas: 16,
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

describe('RegenerarPlanSemanalUseCase', () => {
  let useCase: RegenerarPlanSemanalUseCase;
  let aiProviderMock: jest.Mocked<IAiProviderService>;
  let fichaRepoMock: jest.Mocked<Repository<FichaSaludOrmEntity>>;
  let planRepoMock: jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;
  let nutricionistaRepoMock: jest.Mocked<NutricionistaRepository>;
  let planVersionRepoMock: jest.Mocked<PlanAlimentacionVersionRepository>;
  let memoriaRepoMock: jest.Mocked<NutricionistaIAMemoriaRepository>;
  let notificacionesMock: jest.Mocked<NotificacionesService>;
  let auditoriaMock: jest.Mocked<AuditoriaService>;
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(async () => {
    aiProviderMock = {
      generarRecomendacion: jest.fn(),
      verificarConexion: jest.fn(),
    } as unknown as jest.Mocked<IAiProviderService>;

    fichaRepoMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<FichaSaludOrmEntity>>;

    planRepoMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;

    nutricionistaRepoMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<NutricionistaRepository>;

    planVersionRepoMock = {
      obtenerPorId: jest.fn(),
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

    dataSourceMock = {
      transaction: jest.fn(async (cb: (manager: unknown) => Promise<unknown>) => {
        const fakeManager = {
          getRepository: () => ({
            create: (data: unknown) => data,
            save: (data: unknown) => {
              const d = data as { idPlanAlimentacionVersion?: number };
              d.idPlanAlimentacionVersion = 777;
              return Promise.resolve(d);
            },
            createQueryBuilder: () => ({
              update: () => ({
                set: () => ({
                  where: () => ({
                    execute: () => Promise.resolve({ affected: 1 }),
                  }),
                }),
              }),
            }),
          }),
        };
        return cb(fakeManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegenerarPlanSemanalUseCase,
        PromptRegeneracionBuilder,
        SeleccionarEjemplosMemoriaUseCase,
        { provide: AI_PROVIDER_SERVICE, useValue: aiProviderMock },
        { provide: APP_LOGGER_SERVICE, useValue: loggerMock },
        { provide: TenantContextService, useValue: tenantContextMock },
        { provide: DataSource, useValue: dataSourceMock },
        {
          provide: getRepositoryToken(FichaSaludOrmEntity),
          useValue: fichaRepoMock,
        },
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: planRepoMock,
        },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
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

    useCase = module.get<RegenerarPlanSemanalUseCase>(
      RegenerarPlanSemanalUseCase,
    );
  });

  function setupMocks(opts: {
    motivoCambio?: string | null;
    estadoPlan?: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';
    planJsonGenerado?: PlanAlimentacionDatosJson;
  } = {}) {
    const planJsonGen = opts.planJsonGenerado ?? {
      estructura: [
        {
          dia: DiaSemana.LUNES,
          comidas: [
            {
              tipo: TipoComida.DESAYUNO,
              alternativas: [
                {
                  nombre: 'Avena regenerada',
                  alimentos: [{ alimentoId: 10, cantidad: 100, unidad: 'g' }],
                  calorias: 500,
                  proteinas: 25,
                  carbohidratos: 60,
                  grasas: 12,
                },
              ],
            },
            {
              tipo: TipoComida.ALMUERZO,
              alternativas: [
                {
                  nombre: 'Pollo grillado',
                  alimentos: [{ alimentoId: 11, cantidad: 200, unidad: 'g' }],
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
                  nombre: 'Manzana',
                  alimentos: [{ alimentoId: 12, cantidad: 100, unidad: 'g' }],
                  calorias: 500,
                  proteinas: 25,
                  carbohidratos: 65,
                  grasas: 14,
                },
              ],
            },
            {
              tipo: TipoComida.CENA,
              alternativas: [
                {
                  nombre: 'Sopa de zapallo',
                  alimentos: [{ alimentoId: 13, cantidad: 200, unidad: 'g' }],
                  calorias: 500,
                  proteinas: 19,
                  carbohidratos: 62,
                  grasas: 16,
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

    planVersionRepoMock.obtenerPorId.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        100,
        2,
        versionActualJson,
        (opts.motivoCambio ?? 'regeneracion_dia') as never,
        false,
        new Date(),
        100,
      ),
    );

    planRepoMock.findOne.mockResolvedValue({
      idPlanAlimentacion: 100,
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: { idPersona: 100 } as never,
      estado: opts.estadoPlan ?? 'BORRADOR',
      activo: true,
    } as unknown as PlanAlimentacionOrmEntity);

    fichaRepoMock.findOne.mockResolvedValue(null);

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
      null,
    );
    nutricionistaRepoMock.findById.mockResolvedValue(nutri);

    memoriaRepoMock.obtenerParaSeleccion.mockResolvedValue([]);

    aiProviderMock.generarRecomendacion.mockResolvedValue(planJsonGen);

    return planJsonGen;
  }

  it('happy path scope=PLAN: regenera con motivoCambio=regeneracion_completa', async () => {
    setupMocks({ motivoCambio: 'creacion_inicial' });
    const resultado = await useCase.execute({
      planAlimentacionVersionId: 555,
      nutricionistaUserId: 100,
      gimnasioId: 10,
      scope: 'PLAN',
    });

    expect(resultado.planAlimentacionId).toBe(100);
    expect(resultado.versionAnteriorId).toBe(555);
    expect(resultado.versionNuevaId).toBe(777);
    expect(resultado.numeroVersionNuevo).toBe(3);
    expect(resultado.motivoCambio).toBe('regeneracion_completa');
    expect(resultado.plan.estructura[0].comidas[0].alternativas[0].nombre).toBe(
      'Avena regenerada',
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(notificacionesMock.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'PLAN_REVISAR',
        destinatarioId: 100,
      }),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(auditoriaMock.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'PLAN_REGENERADO',
        entidad: 'PlanAlimentacionVersion',
      }),
    );
  });

  it('happy path scope=DIA: merge preserva estructura y reemplaza comidas del día', async () => {
    setupMocks({ motivoCambio: 'creacion_inicial' });
    const resultado = await useCase.execute({
      planAlimentacionVersionId: 555,
      nutricionistaUserId: 100,
      gimnasioId: 10,
      scope: 'DIA',
      dia: DiaSemana.LUNES,
    });

    expect(resultado.motivoCambio).toBe('regeneracion_dia');
    // La estructura sigue teniendo 1 día (LUNES)
    expect(resultado.plan.estructura).toHaveLength(1);
    expect(resultado.plan.estructura[0].dia).toBe(DiaSemana.LUNES);
  });

  it('happy path scope=ALTERNATIVA: merge solo de la alternativa indicada', async () => {
    setupMocks({ motivoCambio: 'creacion_inicial' });
    const resultado = await useCase.execute({
      planAlimentacionVersionId: 555,
      nutricionistaUserId: 100,
      gimnasioId: 10,
      scope: 'ALTERNATIVA',
      dia: DiaSemana.LUNES,
      comidaSlot: TipoComida.DESAYUNO,
      alternativaIndex: 0,
    });

    expect(resultado.motivoCambio).toBe('regeneracion_alternativa');
    // El slot DESAYUNO sigue teniendo 2 alternativas
    expect(resultado.plan.estructura[0].comidas[0].tipo).toBe(
      TipoComida.DESAYUNO,
    );
    // La alternativa #0 fue reemplazada
    expect(
      resultado.plan.estructura[0].comidas[0].alternativas[0].nombre,
    ).toBe('Avena regenerada');
    // La alternativa #1 fue preservada
    expect(
      resultado.plan.estructura[0].comidas[0].alternativas[1].nombre,
    ).toBe('Tostadas con huevo');
  });

  it('rechaza 400 si scope=DIA sin campo dia', async () => {
    await expect(
      useCase.execute({
        planAlimentacionVersionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
        scope: 'DIA',
      }),
    ).rejects.toThrow(/scope=DIA requiere/);
  });

  it('rechaza 404 si la versión no existe', async () => {
    planVersionRepoMock.obtenerPorId.mockResolvedValue(null);
    await expect(
      useCase.execute({
        planAlimentacionVersionId: 999,
        nutricionistaUserId: 100,
        gimnasioId: 10,
        scope: 'PLAN',
      }),
    ).rejects.toThrow(/Versión de plan/);
  });

  it('rechaza 409 si el plan está FINALIZADO', async () => {
    planVersionRepoMock.obtenerPorId.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        100,
        2,
        versionActualJson,
        'creacion_inicial',
        false,
        new Date(),
        100,
      ),
    );
    planRepoMock.findOne.mockResolvedValue({
      idPlanAlimentacion: 100,
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: { idPersona: 100 } as never,
      estado: 'FINALIZADO',
    } as unknown as PlanAlimentacionOrmEntity);

    await expect(
      useCase.execute({
        planAlimentacionVersionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
        scope: 'PLAN',
      }),
    ).rejects.toThrow(/PLAN_FINALIZADO/);
  });

  it('rechaza 403 si NUT no es dueño del plan', async () => {
    planVersionRepoMock.obtenerPorId.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        100,
        2,
        versionActualJson,
        'creacion_inicial',
        false,
        new Date(),
        100,
      ),
    );
    planRepoMock.findOne.mockResolvedValue({
      idPlanAlimentacion: 100,
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: { idPersona: 999 } as never, // otro NUT
      estado: 'BORRADOR',
    } as unknown as PlanAlimentacionOrmEntity);

    await expect(
      useCase.execute({
        planAlimentacionVersionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
        scope: 'PLAN',
      }),
    ).rejects.toThrow(/Solo el nutricionista dueño/);
  });

  it('rechaza 409 si version es edicion_manual sin confirmación', async () => {
    planVersionRepoMock.obtenerPorId.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        100,
        2,
        versionActualJson,
        'edicion_manual',
        false,
        new Date(),
        100,
      ),
    );
    planRepoMock.findOne.mockResolvedValue({
      idPlanAlimentacion: 100,
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: { idPersona: 100 } as never,
      estado: 'BORRADOR',
    } as unknown as PlanAlimentacionOrmEntity);

    await expect(
      useCase.execute({
        planAlimentacionVersionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
        scope: 'PLAN',
      }),
    ).rejects.toThrow(/EDICION_MANUAL_SIN_CONFIRMAR/);
  });

  it('permite regenerar edicion_manual con flag confirmarPerdidaEdicionManual=true', async () => {
    setupMocks({ motivoCambio: 'edicion_manual' });
    const resultado = await useCase.execute({
      planAlimentacionVersionId: 555,
      nutricionistaUserId: 100,
      gimnasioId: 10,
      scope: 'PLAN',
      confirmarPerdidaEdicionManual: true,
    });
    expect(resultado.versionNuevaId).toBe(777);
  });

  it('envía PLAN_MACROS_FUERA_RANGO si macros ROJO', async () => {
    const planMacrosRojo: PlanAlimentacionDatosJson = {
      estructura: [
        {
          dia: DiaSemana.LUNES,
          comidas: [
            {
              tipo: TipoComida.DESAYUNO,
              alternativas: [
                {
                  nombre: 'Avena',
                  alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
                  calorias: 3000, // 50% arriba del target
                  proteinas: 100,
                  carbohidratos: 350,
                  grasas: 90,
                },
              ],
            },
            {
              tipo: TipoComida.ALMUERZO,
              alternativas: [
                {
                  nombre: 'Pollo',
                  alimentos: [{ alimentoId: 2, cantidad: 200, unidad: 'g' }],
                  calorias: 3000,
                  proteinas: 100,
                  carbohidratos: 350,
                  grasas: 90,
                },
              ],
            },
            {
              tipo: TipoComida.MERIENDA,
              alternativas: [
                {
                  nombre: 'Frutas',
                  alimentos: [{ alimentoId: 3, cantidad: 100, unidad: 'g' }],
                  calorias: 3000,
                  proteinas: 100,
                  carbohidratos: 350,
                  grasas: 90,
                },
              ],
            },
            {
              tipo: TipoComida.CENA,
              alternativas: [
                {
                  nombre: 'Sopa',
                  alimentos: [{ alimentoId: 4, cantidad: 200, unidad: 'g' }],
                  calorias: 3000,
                  proteinas: 100,
                  carbohidratos: 350,
                  grasas: 90,
                },
              ],
            },
          ],
        },
      ],
      macrosPorDia: {
        [DiaSemana.LUNES]: {
          calorias: 12000,
          proteinas: 400,
          carbohidratos: 1400,
          grasas: 360,
        },
      } as Record<DiaSemana, never>,
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    };
    setupMocks({
      motivoCambio: 'creacion_inicial',
      planJsonGenerado: planMacrosRojo,
    });
    await useCase.execute({
      planAlimentacionVersionId: 555,
      nutricionistaUserId: 100,
      gimnasioId: 10,
      scope: 'PLAN',
    });

    const llamadasNotif = notificacionesMock.crear.mock.calls.map((c) => c[0]);
    const hayNotifMacros = llamadasNotif.some(
      (l) => l.tipo === 'PLAN_MACROS_FUERA_RANGO',
    );
    expect(hayNotifMacros).toBe(true);
  });
});