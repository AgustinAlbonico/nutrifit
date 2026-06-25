import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import {
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { ObtenerVersionPlanUseCase } from './obtener-version-plan.use-case';

describe('ObtenerVersionPlanUseCase', () => {
  let useCase: ObtenerVersionPlanUseCase;
  let planVersionRepo: any;
  let planRepo: any;
  let tenantContext: TenantContextService;

  const versionDummy = {
    idPlanAlimentacionVersion: 100,
    idPlanAlimentacion: 50,
    numeroVersion: 1,
    motivoCambio: 'creacion_inicial' as const,
    activa: true,
    createdAt: new Date('2026-06-25T00:00:00Z'),
    createdBy: 5,
    datosJson: {
      estructura: [],
      macrosPorDia: {},
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    },
  };

  const planDummy = {
    idPlanAlimentacion: 50,
    socio: { idPersona: 10, gimnasioId: 1 },
    nutricionista: { idPersona: 5 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObtenerVersionPlanUseCase,
        {
          provide: PLAN_ALIMENTACION_VERSION_REPOSITORY,
          useValue: {
            obtenerPorId: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: {},
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<ObtenerVersionPlanUseCase>(ObtenerVersionPlanUseCase);
    planVersionRepo = module.get(PLAN_ALIMENTACION_VERSION_REPOSITORY);
    planRepo = module.get(getRepositoryToken(PlanAlimentacionOrmEntity));
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  it('lanza NotFoundError si la versión no existe', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        versionId: 999,
        user: { id: 1, rol: Rol.ADMIN, personaId: null, gimnasioId: 1 },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('lanza ForbiddenError si el plan pertenece a otro gimnasio', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce({
      ...planDummy,
      socio: { idPersona: 10, gimnasioId: 99 },
    });

    await expect(
      useCase.execute({
        versionId: 100,
        user: { id: 1, rol: Rol.ADMIN, personaId: null, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('permite NUTRICIONISTA dueño del plan', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    const result = await useCase.execute({
      versionId: 100,
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(result.id).toBe(100);
    expect(result.datosJson).toBeDefined();
  });

  it('lanza ForbiddenError si NUTRICIONISTA no es dueño', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    await expect(
      useCase.execute({
        versionId: 100,
        user: { id: 99, rol: Rol.NUTRICIONISTA, personaId: 99, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('permite SOCIO titular si la versión está activa', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce({
      ...versionDummy,
      activa: true,
    });
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    const result = await useCase.execute({
      versionId: 100,
      user: { id: 10, rol: Rol.SOCIO, personaId: 10, gimnasioId: 1 },
    });

    expect(result.activa).toBe(true);
  });

  it('lanza ForbiddenError si SOCIO pide una versión NO activa', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce({
      ...versionDummy,
      activa: false,
    });
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    await expect(
      useCase.execute({
        versionId: 100,
        user: { id: 10, rol: Rol.SOCIO, personaId: 10, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('lanza ForbiddenError si SOCIO no es titular del plan', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce({
      ...versionDummy,
      activa: true,
    });
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    await expect(
      useCase.execute({
        versionId: 100,
        user: { id: 999, rol: Rol.SOCIO, personaId: 999, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('permite ADMIN sin importar ownership', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    const result = await useCase.execute({
      versionId: 100,
      user: { id: 1, rol: Rol.ADMIN, personaId: null, gimnasioId: 1 },
    });

    expect(result.id).toBe(100);
  });
});
