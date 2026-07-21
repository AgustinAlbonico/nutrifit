/**
 * Spec de FinalizarPlanAlimentacionUseCase
 * ========================================
 *
 * Cobertura:
 *  - Happy path: plan en ACTIVO → finaliza + notifica NUT + socio.
 *  - Rechaza 404 si plan no existe.
 *  - Rechaza 403 si NUT no es dueño.
 *  - Rechaza 422 si plan no está en ACTIVO.
 *  - Rechaza 403 si plan es de otro gimnasio.
 *  - Auditoría PLAN_FINALIZADO_ACCION.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalizarPlanAlimentacionUseCase } from './finalizar-plan-alimentacion.use-case';
import {
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

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

describe('FinalizarPlanAlimentacionUseCase', () => {
  let useCase: FinalizarPlanAlimentacionUseCase;
  let planRepoMock: jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;
  let socioRepoMock: jest.Mocked<Repository<SocioOrmEntity>>;
  let notificacionesMock: jest.Mocked<NotificacionesService>;
  let auditoriaMock: jest.Mocked<AuditoriaService>;

  beforeEach(async () => {
    planRepoMock = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    } as unknown as jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;

    socioRepoMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<SocioOrmEntity>>;

    notificacionesMock = {
      crear: jest.fn().mockResolvedValue({ idNotificacion: 1 }),
    } as unknown as jest.Mocked<NotificacionesService>;

    auditoriaMock = {
      registrar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditoriaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizarPlanAlimentacionUseCase,
        { provide: APP_LOGGER_SERVICE, useValue: loggerMock },
        { provide: TenantContextService, useValue: tenantContextMock },
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: planRepoMock,
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: socioRepoMock,
        },
        { provide: NotificacionesService, useValue: notificacionesMock },
        { provide: AuditoriaService, useValue: auditoriaMock },
      ],
    }).compile();

    useCase = module.get<FinalizarPlanAlimentacionUseCase>(
      FinalizarPlanAlimentacionUseCase,
    );
  });

  function setupMocks(
    opts: {
      estado?: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';
      planNutId?: number;
      planGymId?: number | null;
      socioUserId?: number;
    } = {},
  ) {
    planRepoMock.findOne.mockResolvedValue({
      idPlanAlimentacion: 100,
      socio: {
        idPersona: 50,
        gimnasioId: opts.planGymId ?? 10,
      } as never,
      nutricionista: { idPersona: opts.planNutId ?? 100 } as never,
      estado: opts.estado ?? 'ACTIVO',
      activo: true,
    } as unknown as PlanAlimentacionOrmEntity);

    socioRepoMock.findOne.mockResolvedValue({
      idPersona: 50,
      gimnasioId: 10,
      usuario: { idUsuario: opts.socioUserId ?? 200 } as never,
    } as unknown as SocioOrmEntity);
  }

  it('happy path: plan ACTIVO → finaliza + notifica NUT y socio', async () => {
    setupMocks();
    const resultado = await useCase.execute({
      planAlimentacionId: 100,
      nutricionistaUserId: 100,
      gimnasioId: 10,
    });

    expect(resultado.estado).toBe('FINALIZADO');
    expect(resultado.planAlimentacionId).toBe(100);
    expect(resultado.finalizadoAt).toBeInstanceOf(Date);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planRepoMock.update).toHaveBeenCalledWith(
      { idPlanAlimentacion: 100 },
      expect.objectContaining({
        estado: 'FINALIZADO',
        activo: false,
      }),
    );

    // 2 notificaciones: NUT + socio
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(notificacionesMock.crear).toHaveBeenCalledTimes(2);
    expect(
      notificacionesMock.crear.mock.calls.some(
        (c) => c[0].tipo === 'PLAN_FINALIZADO' && c[0].destinatarioId === 100,
      ),
    ).toBe(true);
    expect(
      notificacionesMock.crear.mock.calls.some(
        (c) => c[0].tipo === 'PLAN_FINALIZADO' && c[0].destinatarioId === 200,
      ),
    ).toBe(true);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(auditoriaMock.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'PLAN_FINALIZADO_ACCION',
        entidad: 'PlanAlimentacion',
      }),
    );
  });

  it('rechaza 404 si plan no existe', async () => {
    planRepoMock.findOne.mockResolvedValue(null);
    await expect(
      useCase.execute({
        planAlimentacionId: 999,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/Plan de alimentación/);
  });

  it('rechaza 403 si NUT no es dueño', async () => {
    setupMocks({ planNutId: 999 });
    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/Solo el nutricionista dueño/);
  });

  it('rechaza 422 si plan está en BORRADOR', async () => {
    setupMocks({ estado: 'BORRADOR' });
    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/PLAN_NO_ACTIVO/);
  });

  it('rechaza 422 si plan ya está FINALIZADO', async () => {
    setupMocks({ estado: 'FINALIZADO' });
    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/PLAN_NO_ACTIVO/);
  });

  it('rechaza 403 si plan pertenece a otro gimnasio', async () => {
    setupMocks({ planGymId: 999 });
    await expect(
      useCase.execute({
        planAlimentacionId: 100,
        nutricionistaUserId: 100,
        gimnasioId: 10,
      }),
    ).rejects.toThrow(/otro gimnasio/);
  });

  it('tolerante a fallos en notificaciones: operación NO falla', async () => {
    setupMocks();
    notificacionesMock.crear.mockRejectedValue(new Error('BD caída'));

    const resultado = await useCase.execute({
      planAlimentacionId: 100,
      nutricionistaUserId: 100,
      gimnasioId: 10,
    });

    expect(resultado.estado).toBe('FINALIZADO');
  });

  it('tolerante a fallos en auditoría: operación NO falla', async () => {
    setupMocks();
    auditoriaMock.registrar.mockRejectedValue(new Error('BD caída'));

    const resultado = await useCase.execute({
      planAlimentacionId: 100,
      nutricionistaUserId: 100,
      gimnasioId: 10,
    });

    expect(resultado.estado).toBe('FINALIZADO');
  });
});
