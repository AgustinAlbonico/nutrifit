import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetSociosKpiUseCase } from './get-socios-kpi.use-case';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';

describe('GetSociosKpiUseCase', () => {
  let useCase: GetSociosKpiUseCase;
  let socioRepository: Repository<SocioOrmEntity>;
  let fichaSaludRepository: Repository<FichaSaludOrmEntity>;
  let planRepository: Repository<PlanAlimentacionOrmEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSociosKpiUseCase,
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(FichaSaludOrmEntity),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: { createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<GetSociosKpiUseCase>(GetSociosKpiUseCase);
    socioRepository = module.get<Repository<SocioOrmEntity>>(
      getRepositoryToken(SocioOrmEntity),
    );
    fichaSaludRepository = module.get<Repository<FichaSaludOrmEntity>>(
      getRepositoryToken(FichaSaludOrmEntity),
    );
    planRepository = module.get<Repository<PlanAlimentacionOrmEntity>>(
      getRepositoryToken(PlanAlimentacionOrmEntity),
    );
  });

  it('debe calcular correctamente los KPIs de socios', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: 10 }),
      getRawMany: jest.fn().mockResolvedValue([{ total: 10 }]),
    };
    jest
      .spyOn(socioRepository, 'createQueryBuilder')
      .mockReturnValue(mockQueryBuilder as any);

    const mockFichaBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ conFicha: 6 }),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ conFicha: 6 }]),
    };
    jest
      .spyOn(fichaSaludRepository, 'createQueryBuilder')
      .mockReturnValue(mockFichaBuilder as any);

    const mockPlanBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ conPlan: 8 }),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ conPlan: 8 }]),
    };
    jest
      .spyOn(planRepository, 'createQueryBuilder')
      .mockReturnValue(mockPlanBuilder as any);

    const result = await useCase.execute();

    expect(result.totalSocios).toBe(10);
    expect(result.conFichaCompleta).toBe(6);
    expect(result.sinFichaCompleta).toBe(4);
    expect(result.conPlanActivo).toBe(8);
    expect(result.sinPlanActivo).toBe(2);
  });

  it('debe retornar ceros cuando no hay socios', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(null),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    jest
      .spyOn(socioRepository, 'createQueryBuilder')
      .mockReturnValue(mockQueryBuilder as any);

    const mockFichaBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(null),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    jest
      .spyOn(fichaSaludRepository, 'createQueryBuilder')
      .mockReturnValue(mockFichaBuilder as any);

    const mockPlanBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(null),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    jest
      .spyOn(planRepository, 'createQueryBuilder')
      .mockReturnValue(mockPlanBuilder as any);

    const result = await useCase.execute();

    expect(result.totalSocios).toBe(0);
    expect(result.conFichaCompleta).toBe(0);
    expect(result.conPlanActivo).toBe(0);
  });
});
