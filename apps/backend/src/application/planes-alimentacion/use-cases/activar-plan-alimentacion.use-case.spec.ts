/**
 * Spec de ActivarPlanAlimentacionUseCase
 * ======================================
 *
 * Cobertura:
 *  - Happy path: versión con macros VERDE → activa y notifica socio.
 *  - Rechaza 404 si plan no existe.
 *  - Rechaza 404 si versión no existe.
 *  - Rechaza 409 si plan está FINALIZADO.
 *  - Rechaza 403 si NUT no es dueño.
 *  - Rechaza 422 si macros no están en VERDE.
 *  - Rechaza 409 si la versión no pertenece al plan.
 *  - Auditoría PLAN_ACTIVADO.
 *  - Notificación PLAN_ACTIVO al socio titular.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ActivarPlanAlimentacionUseCase } from './activar-plan-alimentacion.use-case';
import {
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
  FichaSaludOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import {
  PlanAlimentacionVersionRepository,
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
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

const planJsonVerde: PlanAlimentacionDatosJson = {
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
              nombre: 'Quinoa',
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
              nombre: 'Sopa',
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
      proteinas: 124,
      carbohidratos: 252,
      grasas: 56,
    },
  } as Record<DiaSemana, never>,
  razonamientoCumplimiento: {
    restriccionesCumplidas: [],
    restriccionesNoCumplidas: [],
  },
};

describe('ActivarPlanAlimentacionUseCase', () => {
  let useCase: ActivarPlanAlimentacionUseCase;
  let planRepoMock: jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;
  let socioRepoMock: jest.Mocked<Repository<SocioOrmEntity>>;
  let fichaRepoMock: jest.Mocked<Repository<FichaSaludOrmEntity>>;
  let planVersionRepoMock: jest.Mocked<PlanAlimentacionVersionRepository>;
  let notificacionesMock: jest.Mocked<NotificacionesService>;
  let auditoriaMock: jest.Mocked<AuditoriaService>;
  let dataSourceMock: { transaction: jest.Mock };

  beforeEach(async () => {
    planRepoMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;

    socioRepoMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<SocioOrmEntity>>;

    fichaRepoMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<FichaSaludOrmEntity>>;

    planVersionRepoMock = {
      obtenerPorId: jest.fn(),
    } as unknown as jest.Mocked<PlanAlimentacionVersionRepository>;

    notificacionesMock = {
      crear: jest.fn().mockResolvedValue({ idNotificacion: 1 }),
    } as unknown as jest.Mocked<NotificacionesService>;

    auditoriaMock = {
      registrar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditoriaService>;

    dataSourceMock = {
      transaction: jest.fn(
        async (cb: (manager: unknown) => Promise<unknown>) => {
          const fakeManager = {
            getRepository: () => ({
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
        },
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivarPlanAlimentacionUseCase,
        { provide: APP_LOGGER_SERVICE, useValue: loggerMock },
        { provide: TenantContextService, useValue: tenantContextMock },
        { provide: DataSource, useValue: dataSourceMock },
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: planRepoMock,
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: socioRepoMock,
        },
        {
          provide: getRepositoryToken(FichaSaludOrmEntity),
          useValue: fichaRepoMock,
        },
        {
          provide: PLAN_ALIMENTACION_VERSION_REPOSITORY,
          useValue: planVersionRepoMock,
        },
        { provide: NotificacionesService, useValue: notificacionesMock },
        { provide: AuditoriaService, useValue: auditoriaMock },
      ],
    }).compile();

    useCase = module.get<ActivarPlanAlimentacionUseCase>(
      ActivarPlanAlimentacionUseCase,
    );
  });

  function setupMocks(
    opts: {
      estadoPlan?: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';
      planMacros?: 'VERDE' | 'ROJO';
      planNutId?: number;
      versionPlanId?: number;
    } = {},
  ) {
    planRepoMock.findOne.mockResolvedValue({
      idPlanAlimentacion: 100,
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: { idPersona: opts.planNutId ?? 100 } as never,
      estado: opts.estadoPlan ?? 'BORRADOR',
      activo: false,
    } as unknown as PlanAlimentacionOrmEntity);

    planVersionRepoMock.obtenerPorId.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        opts.versionPlanId ?? 100,
        3,
        opts.planMacros === 'ROJO'
          ? {
              ...planJsonVerde,
              estructura: planJsonVerde.estructura.map((d) => ({
                ...d,
                comidas: d.comidas.map((c) => ({
                  ...c,
                  alternativas: c.alternativas.map((a) => ({
                    ...a,
                    calorias: 3000, // ROJO
                  })),
                })),
              })),
            }
          : planJsonVerde,
        'regeneracion_dia',
        false,
        new Date(),
        opts.planNutId ?? 100,
      ),
    );

    fichaRepoMock.findOne.mockResolvedValue(null);

    socioRepoMock.findOne.mockResolvedValue({
      idPersona: 50,
      gimnasioId: 10,
      usuario: { idUsuario: 200 } as never,
    } as unknown as SocioOrmEntity);
  }

  it('happy path: activa versión y notifica socio', async () => {
    setupMocks();
    const resultado = await useCase.execute({
      planAlimentacionId: 100,
      versionId: 555,
      nutricionistaUserId: 100,
      gimnasioId: 10,
    });

    expect(resultado.estado).toBe('ACTIVO');
    expect(resultado.versionActivaId).toBe(555);
    expect(resultado.planAlimentacionId).toBe(100);

    // Transacción ejecutada
    expect(dataSourceMock.transaction).toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(notificacionesMock.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'PLAN_ACTIVO',
        destinatarioId: 200,
      }),
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(auditoriaMock.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'PLAN_ACTIVADO',
        entidad: 'PlanAlimentacion',
      }),
    );
  });

  it('rechaza 404 si plan no existe', async () => {
    planRepoMock.findOne.mockResolvedValue(null);
    await expect(
      useCase.execute({
        planAlimentacionId: 999,
        versionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/Plan de alimentación/);
  });

  it('rechaza 404 si versión no existe', async () => {
    planRepoMock.findOne.mockResolvedValue({
      idPlanAlimentacion: 100,
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: { idPersona: 100 } as never,
      estado: 'BORRADOR',
    } as unknown as PlanAlimentacionOrmEntity);
    planVersionRepoMock.obtenerPorId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        versionId: 999,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/Versión de plan/);
  });

  it('rechaza 409 si plan está FINALIZADO', async () => {
    setupMocks({ estadoPlan: 'FINALIZADO' });
    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        versionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/PLAN_FINALIZADO/);
  });

  it('rechaza 403 si NUT no es dueño', async () => {
    setupMocks({ planNutId: 999 });
    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        versionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/Solo el nutricionista dueño/);
  });

  it('rechaza 422 si macros no están en VERDE', async () => {
    setupMocks({ planMacros: 'ROJO' });
    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        versionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/MACROS_NO_VERDES/);
  });

  it('rechaza 409 si versión no pertenece al plan', async () => {
    setupMocks({ versionPlanId: 999 });
    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        versionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/no pertenece al plan/);
  });

  it('rechaza 403 si plan pertenece a otro gimnasio', async () => {
    planRepoMock.findOne.mockResolvedValue({
      idPlanAlimentacion: 100,
      socio: { idPersona: 50, gimnasioId: 999 } as never,
      nutricionista: { idPersona: 100 } as never,
      estado: 'BORRADOR',
    } as unknown as PlanAlimentacionOrmEntity);

    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        versionId: 555,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/otro gimnasio/);
  });
});
