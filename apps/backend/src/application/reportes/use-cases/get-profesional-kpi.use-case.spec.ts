import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetProfesionalKpiUseCase } from './get-profesional-kpi.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { SugerenciaIAOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/sugerencia-ia.entity';

describe('GetProfesionalKpiUseCase', () => {
  let useCase: GetProfesionalKpiUseCase;
  let turnoRepository: Repository<TurnoOrmEntity>;
  let sugerenciaIaRepository: Repository<SugerenciaIAOrmEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfesionalKpiUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(SugerenciaIAOrmEntity),
          useValue: { createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<GetProfesionalKpiUseCase>(GetProfesionalKpiUseCase);
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
    sugerenciaIaRepository = module.get<Repository<SugerenciaIAOrmEntity>>(
      getRepositoryToken(SugerenciaIAOrmEntity),
    );
  });

  it('debe calcular correctamente KPIs por profesional', async () => {
    const mockTurnosBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          profesionalId: '1',
          nombreProfesional: 'Dr. Juan Perez',
          turnosProgramados: '20',
          turnosRealizados: '15',
          ausentes: '2',
        },
      ]),
    };
    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(mockTurnosBuilder as any);

    const mockIaBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ profesionalId: '1', cantidad: 5 }]),
    };
    jest
      .spyOn(sugerenciaIaRepository, 'createQueryBuilder')
      .mockReturnValue(mockIaBuilder as any);

    const result = await useCase.execute(
      new Date('2024-01-01'),
      new Date('2024-01-31'),
    );

    expect(result).toHaveLength(1);
    expect(result[0].profesionalId).toBe('1');
    expect(result[0].nombreProfesional).toBe('Dr. Juan Perez');
    expect(result[0].turnosProgramados).toBe(20);
    expect(result[0].turnosRealizados).toBe(15);
    expect(result[0].ratioAusencias).toBeCloseTo(0.1, 2);
    expect(result[0].usoIa).toBe(5);
  });

  it('debe retornar array vacio cuando no hay profesionales con turnos', async () => {
    const mockTurnosBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(mockTurnosBuilder as any);

    const mockIaBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    jest
      .spyOn(sugerenciaIaRepository, 'createQueryBuilder')
      .mockReturnValue(mockIaBuilder as any);

    const result = await useCase.execute(
      new Date('2024-01-01'),
      new Date('2024-01-31'),
    );

    expect(result).toHaveLength(0);
  });
});
