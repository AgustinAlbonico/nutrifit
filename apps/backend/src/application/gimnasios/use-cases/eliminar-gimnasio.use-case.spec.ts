import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { EliminarGimnasioUseCase } from './eliminar-gimnasio.use-case';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';

describe('EliminarGimnasioUseCase', () => {
  let useCase: EliminarGimnasioUseCase;
  let mockRepository: jest.Mocked<GimnasioRepository>;

  const mockGimnasio = (
    overrides: Partial<GimnasioEntity> = {},
  ): GimnasioEntity => {
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
      delete: jest.fn(),
      softDelete: jest.fn(),
      findAll: jest.fn(),
      findActivos: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByNombre: jest.fn(),
    } as unknown as jest.Mocked<GimnasioRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EliminarGimnasioUseCase,
        { provide: GIMNASIO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<EliminarGimnasioUseCase>(EliminarGimnasioUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  describe('execute', () => {
    it('debe eliminar (soft delete) un gimnasio existente', async () => {
      const gimnasio = mockGimnasio({ id: 5 });
      mockRepository.findById.mockResolvedValue(gimnasio);
      mockRepository.delete.mockResolvedValue();

      await useCase.execute(5);

      expect(mockRepository.findById).toHaveBeenCalledWith(5);
      expect(mockRepository.delete).toHaveBeenCalledWith(5);
    });

    it('debe lanzar NotFoundError si el gimnasio no existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(999)).rejects.toThrow(NotFoundError);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
