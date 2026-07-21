/**
 * PersistirPlanManualUseCase — Spec mínima
 *
 * Cobertura: shape feliz + auth + 404.
 * El detalle completo (concurrencia, validacion de alimentos, auditoría)
 * lo garantiza el flujo de `CrearPlanAlimentacionUseCase` ya existente.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PersistirPlanManualUseCase } from './persistir-plan-manual.use-case';
import {
  AlimentoOrmEntity,
  DiaPlanOrmEntity,
  ItemComidaOrmEntity,
  NutricionistaOrmEntity,
  OpcionComidaOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
  PlanAlimentacionVersionRepository,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { RestriccionesValidator } from 'src/application/restricciones/restricciones-validator.service';
import { DataSource } from 'typeorm';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';

const loggerMock = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
} as unknown as jest.Mocked<IAppLoggerService>;

describe('PersistirPlanManualUseCase', () => {
  let sut: PersistirPlanManualUseCase;
  let planRepo: { findOne: jest.Mock };
  let planVersionRepo: {
    listarPorPlan: jest.Mock;
    crear: jest.Mock;
    marcarActiva: jest.Mock;
  };
  let versionRepoMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    planRepo = { findOne: jest.fn() };
    planVersionRepo = {
      listarPorPlan: jest.fn().mockResolvedValue([]),
      crear: jest.fn().mockImplementation(async (input) => ({
        idPlanAlimentacionVersion: 1,
        numeroVersion: input.numeroVersion,
        datosJson: input.datosJson,
        motivoCambio: input.motivoCambio,
        activa: input.activa,
        createdBy: input.createdBy,
      })),
      marcarActiva: jest.fn().mockResolvedValue({}),
    };
    versionRepoMock = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((x) => x),
      save: jest.fn().mockImplementation(async (x) => x),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersistirPlanManualUseCase,
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: planRepo,
        },
        {
          provide: getRepositoryToken(DiaPlanOrmEntity),
          useValue: {
            save: jest.fn().mockImplementation(async (d) => d),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(OpcionComidaOrmEntity),
          useValue: {
            save: jest.fn().mockImplementation(async (o) => o),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(AlimentoOrmEntity),
          useValue: {
            findBy: jest.fn().mockResolvedValue([
              {
                idAlimento: 1,
                nombre: 'Avena',
                unidadMedida: 'g',
                calorias: 350,
                proteinas: 12,
                carbohidratos: 60,
                grasas: 8,
              },
            ]),
          },
        },
        { provide: getRepositoryToken(SocioOrmEntity), useValue: {} },
        { provide: getRepositoryToken(NutricionistaOrmEntity), useValue: {} },
        { provide: getRepositoryToken(UsuarioOrmEntity), useValue: {} },
        { provide: getRepositoryToken(ItemComidaOrmEntity), useValue: {} },
        {
          provide: PLAN_ALIMENTACION_VERSION_REPOSITORY,
          useValue: planVersionRepo,
        },
        {
          provide: DataSource,
          useValue: {
            transaction: async (fn: (m: unknown) => unknown) =>
              fn({
                getRepository: () => versionRepoMock,
              }),
          },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: RestriccionesValidator,
          useValue: { generarIncidencias: jest.fn().mockResolvedValue([]) },
        },
        { provide: TenantContextService, useValue: { gimnasioId: 1 } },
        { provide: APP_LOGGER_SERVICE, useValue: loggerMock },
      ],
    }).compile();

    sut = module.get(PersistirPlanManualUseCase);
  });

  it('crea nueva version inmutable V2 con motivo edicion_manual', async () => {
    planRepo.findOne.mockResolvedValue({
      idPlanAlimentacion: 1,
      activo: true,
      nutricionista: { idPersona: 5 },
      socio: { idPersona: 50 },
      dias: [],
    });
    planVersionRepo.listarPorPlan.mockResolvedValue([
      { idPlanAlimentacionVersion: 99, numeroVersion: 1, activa: true },
    ]);
    planRepo.findOne.mockResolvedValueOnce({
      idPlanAlimentacion: 1,
      activo: true,
      nutricionista: { idPersona: 5 },
      socio: { idPersona: 50 },
      dias: [],
    });

    const dto = {
      dias: [
        {
          dia: 'LUNES' as const,
          orden: 1,
          comidas: [
            {
              tipoComida: 'DESAYUNO' as const,
              alternativas: [
                {
                  nombre: 'Avena con frutas',
                  alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g' }],
                },
              ],
            },
          ],
        },
      ],
    };

    await sut.execute(5, 'NUTRICIONISTA', 1, dto as never);

    expect(versionRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idPlanAlimentacion: 1,
        numeroVersion: 0,
        motivoCambio: 'edicion_manual',
        activa: false,
        createdBy: 5,
      }),
    );
  });

  it('permite guardar un plan manual en borrador aunque todavía no esté activo', async () => {
    planRepo.findOne
      .mockResolvedValueOnce({
        idPlanAlimentacion: 1,
        activo: false,
        estado: 'BORRADOR',
        nutricionista: { idPersona: 5 },
        socio: { idPersona: 50 },
        dias: [],
      })
      .mockResolvedValueOnce({
        idPlanAlimentacion: 1,
        activo: false,
        estado: 'BORRADOR',
        nutricionista: { idPersona: 5 },
        socio: { idPersona: 50 },
        dias: [],
      });

    const dto = {
      dias: [
        {
          dia: 'LUNES' as const,
          orden: 1,
          comidas: [
            {
              tipoComida: 'DESAYUNO' as const,
              alternativas: [
                {
                  nombre: 'Avena con frutas',
                  alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g' }],
                },
              ],
            },
          ],
        },
      ],
    };

    await sut.execute(5, 'NUTRICIONISTA', 1, dto as never);

    expect(versionRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idPlanAlimentacion: 1,
        numeroVersion: 0,
        motivoCambio: 'creacion_inicial',
        activa: false,
        createdBy: 5,
      }),
    );
  });

  it('devuelve 404 si el plan no existe', async () => {
    planRepo.findOne.mockResolvedValue(null);

    await expect(
      sut.execute(5, 'NUTRICIONISTA', 999, { dias: [] } as never),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('devuelve 403 si el NUT no es dueño del plan', async () => {
    planRepo.findOne.mockResolvedValue({
      idPlanAlimentacion: 1,
      activo: true,
      nutricionista: { idPersona: 99 },
      socio: { idPersona: 50 },
      dias: [],
    });

    await expect(
      sut.execute(5, 'NUTRICIONISTA', 1, { dias: [] } as never),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
