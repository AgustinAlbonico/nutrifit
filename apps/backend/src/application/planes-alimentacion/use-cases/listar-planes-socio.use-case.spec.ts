import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { ListarPlanesSocioUseCase } from './listar-planes-socio.use-case';
import {
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';

describe('ListarPlanesSocioUseCase - Multi-Tenant Isolation', () => {
  let useCase: ListarPlanesSocioUseCase;
  let planRepo: any;
  let socioRepo: any;
  let tenantContext: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarPlanesSocioUseCase,
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
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

    useCase = module.get<ListarPlanesSocioUseCase>(ListarPlanesSocioUseCase);
    planRepo = module.get(getRepositoryToken(PlanAlimentacionOrmEntity));
    socioRepo = module.get(getRepositoryToken(SocioOrmEntity));
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  it('debe filtrar socio por gimnasioId antes de listar planes', async () => {
    socioRepo.findOne.mockResolvedValueOnce({ idPersona: 1, gimnasioId: 1 });

    await useCase.execute(1);

    expect(socioRepo.findOne).toHaveBeenCalledWith({
      where: {
        idPersona: 1,
        gimnasioId: 1,
      },
    });
  });

  it('debe filtrar planes por gimnasioId del TenantContext', async () => {
    socioRepo.findOne.mockResolvedValueOnce({ idPersona: 1, gimnasioId: 1 });

    await useCase.execute(1);

    expect(planRepo.find).toHaveBeenCalledWith({
      where: {
        socio: { idPersona: 1, gimnasioId: 1 },
      },
      relations: expect.objectContaining({
        dias: { opcionesComida: { items: { alimento: true } } },
        socio: true,
        nutricionista: true,
      }),
      order: { fechaCreacion: 'DESC' },
    });
  });

  it('debe lanzar NotFoundError cuando el socio no existe', async () => {
    socioRepo.findOne.mockResolvedValueOnce(null);

    await expect(useCase.execute(999)).rejects.toThrow('Socio');
  });

  it('debe lanzar NotFoundError cuando el socio pertenece a otro gimnasio', async () => {
    socioRepo.findOne.mockResolvedValueOnce(null);

    await expect(useCase.execute(1)).rejects.toThrow('Socio');
  });
});