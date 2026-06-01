import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgendaRepositoryImplementation } from './agenda.repository';
import { AgendaOrmEntity } from '../entities/agenda.entity';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

describe('AgendaRepositoryImplementation', () => {
  let repository: AgendaRepositoryImplementation;
  let mockRepo: jest.Mocked<Repository<AgendaOrmEntity>>;
  let mockNutriRepo: jest.Mocked<Repository<NutricionistaOrmEntity>>;
  let mockTenantContext: { isInitialized: boolean; gimnasioId: number };

  const mockNutricionista = {
    idPersona: 10,
    gimnasioId: 5,
  } as NutricionistaOrmEntity;

  const createMockAgendaEntity = (
    overrides: Partial<AgendaOrmEntity> = {},
  ): AgendaOrmEntity =>
    ({
      idAgenda: 1,
      dia: DiaSemana.LUNES,
      horaInicio: '08:00',
      horaFin: '16:00',
      duracionTurno: 30,
      nutricionista: mockNutricionista,
      ...overrides,
    }) as AgendaOrmEntity;

  const createAgendaEntity = (
    id: number | null,
    dia: DiaSemana,
    horaInicio: string,
    horaFin: string,
    duracionTurno: number,
  ): AgendaEntity =>
    new AgendaEntity(id, dia, horaInicio, horaFin, duracionTurno);

  beforeEach(async () => {
    mockTenantContext = { isInitialized: false, gimnasioId: 0 };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaRepositoryImplementation,
        {
          provide: getRepositoryToken(AgendaOrmEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            get isInitialized() {
              return mockTenantContext.isInitialized;
            },
            get gimnasioId() {
              if (!mockTenantContext.isInitialized)
                throw new Error('Not initialized');
              return mockTenantContext.gimnasioId;
            },
          },
        },
      ],
    }).compile();

    repository = module.get<AgendaRepositoryImplementation>(
      AgendaRepositoryImplementation,
    );
    mockRepo = module.get(getRepositoryToken(AgendaOrmEntity));
    mockNutriRepo = module.get(getRepositoryToken(NutricionistaOrmEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByNutricionistaId', () => {
    it('should filter by gimnasioId when tenant context is initialized', async () => {
      mockTenantContext.isInitialized = true;
      mockTenantContext.gimnasioId = 5;

      const mockEntities = [
        createMockAgendaEntity({ idAgenda: 1, dia: DiaSemana.LUNES }),
      ];
      mockRepo.find.mockResolvedValue(mockEntities);

      const result = await repository.findByNutricionistaId(10);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: {
          nutricionista: { idPersona: 10, gimnasioId: 5 },
        },
        order: { dia: 'ASC', horaInicio: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].dia).toBe(DiaSemana.LUNES);
    });

    it('should NOT filter by gimnasioId when tenant context is not initialized', async () => {
      mockTenantContext.isInitialized = false;

      const mockEntities = [
        createMockAgendaEntity({ idAgenda: 1, dia: DiaSemana.LUNES }),
        createMockAgendaEntity({ idAgenda: 2, dia: DiaSemana.MARTES }),
      ];
      mockRepo.find.mockResolvedValue(mockEntities);

      const result = await repository.findByNutricionistaId(10);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { nutricionista: { idPersona: 10 } },
        order: { dia: 'ASC', horaInicio: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no agendas found', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await repository.findByNutricionistaId(10);

      expect(result).toEqual([]);
    });
  });

  describe('replaceByNutricionistaId', () => {
    it('should throw BadRequestError when nutricionista belongs to a different gym', async () => {
      mockTenantContext.isInitialized = true;
      mockTenantContext.gimnasioId = 5;

      mockNutriRepo.findOne.mockResolvedValueOnce({
        idPersona: 10,
        gimnasioId: 99,
      } as NutricionistaOrmEntity);

      const mockQb = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      (mockRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQb);

      const agendas = [
        createAgendaEntity(null, DiaSemana.LUNES, '08:00', '16:00', 30),
      ];

      try {
        await repository.replaceByNutricionistaId(10, agendas);
        fail('Expected BadRequestError');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestError);
        expect((err as BadRequestError).message).toBe(
          'No tienes permiso para modificar la agenda de este nutricionista',
        );
      }
    });

    it('should throw BadRequestError when foreign nutricionista has zero agenda rows', async () => {
      mockTenantContext.isInitialized = true;
      mockTenantContext.gimnasioId = 5;

      mockNutriRepo.findOne.mockResolvedValueOnce({
        idPersona: 10,
        gimnasioId: 99,
      } as NutricionistaOrmEntity);

      const mockQb = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      (mockRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQb);

      const agendas = [
        createAgendaEntity(null, DiaSemana.LUNES, '08:00', '16:00', 30),
      ];

      try {
        await repository.replaceByNutricionistaId(10, agendas);
        fail('Expected BadRequestError');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestError);
        expect((err as BadRequestError).message).toBe(
          'No tienes permiso para modificar la agenda de este nutricionista',
        );
      }
    });

    it('should throw BadRequestError when nutricionista not found at all', async () => {
      mockTenantContext.isInitialized = true;
      mockTenantContext.gimnasioId = 5;

      mockNutriRepo.findOne.mockResolvedValueOnce(null);

      const mockQb = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      (mockRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQb);

      const agendas = [
        createAgendaEntity(null, DiaSemana.LUNES, '08:00', '16:00', 30),
      ];

      try {
        await repository.replaceByNutricionistaId(10, agendas);
        fail('Expected BadRequestError');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestError);
        expect((err as BadRequestError).message).toBe(
          'Nutricionista no encontrado',
        );
      }
    });

    it('should perform replacement when nutricionista belongs to current gym', async () => {
      mockTenantContext.isInitialized = true;
      mockTenantContext.gimnasioId = 5;

      mockNutriRepo.findOne.mockResolvedValueOnce({
        idPersona: 10,
        gimnasioId: 5,
      } as NutricionistaOrmEntity);

      const mockQb = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      (mockRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQb);
      mockRepo.save.mockResolvedValue([] as any);

      const agendas = [
        createAgendaEntity(null, DiaSemana.LUNES, '08:00', '16:00', 30),
      ];
      const result = await repository.replaceByNutricionistaId(10, agendas);

      expect(mockNutriRepo.findOne).toHaveBeenCalledWith({
        where: { idPersona: 10 },
        select: ['idPersona', 'gimnasioId'],
      });
      expect(mockQb.execute).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should replace agendas without tenant context check when not initialized', async () => {
      mockTenantContext.isInitialized = false;

      const mockQb = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      (mockRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQb);
      mockRepo.save.mockResolvedValue([] as any);

      const agendas = [
        createAgendaEntity(null, DiaSemana.LUNES, '08:00', '16:00', 30),
      ];
      const result = await repository.replaceByNutricionistaId(10, agendas);

      expect(mockNutriRepo.findOne).not.toHaveBeenCalled();
      expect(mockQb.execute).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
