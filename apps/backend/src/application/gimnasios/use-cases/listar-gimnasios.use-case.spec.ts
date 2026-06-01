import { Test, TestingModule } from '@nestjs/testing';
import { ListarGimnasiosUseCase } from './listar-gimnasios.use-case';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';

describe('ListarGimnasiosUseCase', () => {
  let useCase: ListarGimnasiosUseCase;
  let mockRepository: jest.Mocked<GimnasioRepository>;

  const mockGimnasio = (overrides: Partial<GimnasioEntity> = {}): GimnasioEntity => {
    return new GimnasioEntity({
      id: 1,
      nombre: 'Gym Central',
      direccion: 'Calle Principal 123',
      telefono: '1234567890',
      email: null,
      fechaAlta: new Date(),
      fechaBaja: null,
      ...overrides,
    });
  };

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findActivos: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByNombre: jest.fn(),
    } as unknown as jest.Mocked<GimnasioRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarGimnasiosUseCase,
        { provide: GIMNASIO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<ListarGimnasiosUseCase>(ListarGimnasiosUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  describe('execute', () => {
    it('debe retornar todos los gimnasios activos', async () => {
      const gimnasios = [
        mockGimnasio({ id: 1, nombre: 'Gym Central' }),
        mockGimnasio({ id: 2, nombre: 'Gym Norte' }),
        mockGimnasio({ id: 3, nombre: 'Gym Sur' }),
      ];

      mockRepository.findActivos.mockResolvedValue(gimnasios);

      const result = await useCase.execute();

      expect(mockRepository.findActivos).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0].nombre).toBe('Gym Central');
      expect(result[1].nombre).toBe('Gym Norte');
      expect(result[2].nombre).toBe('Gym Sur');
    });

    it('debe retornar array vacio cuando no hay gimnasios', async () => {
      mockRepository.findActivos.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
      expect(mockRepository.findActivos).toHaveBeenCalled();
    });
  });
});