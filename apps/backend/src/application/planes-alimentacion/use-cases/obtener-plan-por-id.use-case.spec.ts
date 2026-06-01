import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { ObtenerPlanPorIdUseCase } from './obtener-plan-por-id.use-case';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';

describe('ObtenerPlanPorIdUseCase - Multi-Tenant Isolation', () => {
  let useCase: ObtenerPlanPorIdUseCase;
  let planRepo: any;
  let tenantContext: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObtenerPlanPorIdUseCase,
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<ObtenerPlanPorIdUseCase>(ObtenerPlanPorIdUseCase);
    planRepo = module.get(getRepositoryToken(PlanAlimentacionOrmEntity));
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  it('debe filtrar planes por gimnasioId del TenantContext', async () => {
    const mockPlan = {
      idPlanAlimentacion: 1,
      objetivoNutricional: 'Test',
      dias: [],
      socio: { idPersona: 1, gimnasioId: 1 },
      nutricionista: { idPersona: 1, nombre: 'Nutri' },
    };
    planRepo.findOne.mockResolvedValueOnce(mockPlan);

    await useCase.execute(1);

    expect(planRepo.findOne).toHaveBeenCalledWith({
      where: {
        idPlanAlimentacion: 1,
        socio: { gimnasioId: 1 },
      },
      relations: expect.objectContaining({
        dias: { opcionesComida: { items: { alimento: true } } },
        socio: true,
        nutricionista: true,
      }),
    });
  });

  it('debe lanzar NotFoundError cuando el plan no existe', async () => {
    planRepo.findOne.mockResolvedValueOnce(null);

    await expect(useCase.execute(999)).rejects.toThrow('Plan de alimentación');
  });
});
