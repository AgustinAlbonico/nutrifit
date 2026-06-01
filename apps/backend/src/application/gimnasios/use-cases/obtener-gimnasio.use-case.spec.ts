import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { ObtenerGimnasioUseCase } from './obtener-gimnasio.use-case';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';

describe('ObtenerGimnasioUseCase', () => {
  let useCase: ObtenerGimnasioUseCase;
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
      findById: jest.fn(),
      findAll: jest.fn(),
      findActivos: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByNombre: jest.fn(),
    } as unknown as jest.Mocked<GimnasioRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObtenerGimnasioUseCase,
        { provide: GIMNASIO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<ObtenerGimnasioUseCase>(ObtenerGimnasioUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  describe('execute', () => {
    it('debe retornar gimnasio cuando existe', async () => {
      const gimnasio = mockGimnasio({ id: 5 });
      mockRepository.findById.mockResolvedValue(gimnasio);

      const result = await useCase.execute(5);

      expect(mockRepository.findById).toHaveBeenCalledWith(5);
      expect(result.id).toBe(5);
      expect(result.nombre).toBe('Gym Central');
    });

    it('debe lanzar NotFoundError cuando el gimnasio no existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(999)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute(999)).rejects.toThrow(
        'Gimnasio no encontrado con ID 999',
      );
    });
  });
});