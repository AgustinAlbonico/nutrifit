import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetTurnosDelDiaUseCase } from './get-turnos-del-dia.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';

describe('GetTurnosDelDiaUseCase - Multi-Tenant Isolation', () => {
  let useCase: GetTurnosDelDiaUseCase;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let nutricionistaRepository: NutricionistaRepository;
  let tenantContext: TenantContextService;

  const mockNutricionista = {
    idPersona: 10,
    nombre: 'Dr.',
    apellido: 'Test',
    gimnasioId: 1,
  } as NutricionistaOrmEntity;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTurnosDelDiaUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<GetTurnosDelDiaUseCase>(GetTurnosDelDiaUseCase);
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    nutricionistaRepository = module.get(NUTRICIONISTA_REPOSITORY);
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Tenant Isolation', () => {
    it('debe filtrar turnos por gimnasioId del TenantContext', async () => {
      // Arrange
      jest.mocked(nutricionistaRepository.findById).mockResolvedValue(mockNutricionista as any);

      // Act
      await useCase.execute(10, {});

      // Assert
      const queryBuilder = turnoRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'nutricionista.gimnasioId = :gimnasioId',
        { gimnasioId: 1 },
      );
    });

    it('debe lanzar NotFoundError cuando el nutricionista no existe', async () => {
      // Arrange
      jest.mocked(nutricionistaRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(999, {})).rejects.toThrow(NotFoundError);
    });

    it('debe usar diferente gimnasioId cuando el tenant es diferente', async () => {
      // Arrange
      jest.clearAllMocks();

      // Cambiar el tenant context a gimnasio 5
      (tenantContext as any).gimnasioId = 5;

      jest.mocked(nutricionistaRepository.findById).mockResolvedValue({
        ...mockNutricionista,
        gimnasioId: 5,
      } as any);

      // Act
      await useCase.execute(10, {});

      // Assert
      const queryBuilder = turnoRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'nutricionista.gimnasioId = :gimnasioId',
        { gimnasioId: 5 },
      );
    });
  });
});