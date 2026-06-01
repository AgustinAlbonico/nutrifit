import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundError,
  ConflictError,
} from 'src/domain/exceptions/custom-exceptions';
import { ActualizarGimnasioUseCase } from './actualizar-gimnasio.use-case';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';

describe('ActualizarGimnasioUseCase', () => {
  let useCase: ActualizarGimnasioUseCase;
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
      update: jest.fn(),
      findByNombre: jest.fn(),
      findAll: jest.fn(),
      findActivos: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<GimnasioRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActualizarGimnasioUseCase,
        { provide: GIMNASIO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<ActualizarGimnasioUseCase>(ActualizarGimnasioUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  describe('execute', () => {
    it('debe actualizar el nombre de un gimnasio existente', async () => {
      const dto = { nombre: 'Gym Centro' };
      const gimnasioExistente = mockGimnasio({ id: 1, nombre: 'Gym Central' });
      const gimnasioActualizado = mockGimnasio({ id: 1, nombre: 'Gym Centro' });

      mockRepository.findById.mockResolvedValue(gimnasioExistente);
      mockRepository.update.mockResolvedValue(gimnasioActualizado);

      const result = await useCase.execute(1, dto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nombre: 'Gym Centro' }),
      );
      expect(result.nombre).toBe('Gym Centro');
    });

    it('debe actualizar la direccion y telefono', async () => {
      const dto = {
        direccion: 'Nueva Direccion 456',
        telefono: '9876543210',
      };
      const gimnasioExistente = mockGimnasio({ id: 1 });
      const gimnasioActualizado = mockGimnasio({
        id: 1,
        direccion: 'Nueva Direccion 456',
        telefono: '9876543210',
      });

      mockRepository.findById.mockResolvedValue(gimnasioExistente);
      mockRepository.update.mockResolvedValue(gimnasioActualizado);

      const result = await useCase.execute(1, dto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          direccion: 'Nueva Direccion 456',
          telefono: '9876543210',
        }),
      );
      expect(result.direccion).toBe('Nueva Direccion 456');
      expect(result.telefono).toBe('9876543210');
    });

    it('debe lanzar ConflictError si el nuevo nombre ya existe en otro gimnasio', async () => {
      const dto = { nombre: 'Gym Norte' };
      const gimnasioActual = mockGimnasio({ id: 1, nombre: 'Gym Central' });
      const gimnasioConNombreExistente = mockGimnasio({
        id: 2,
        nombre: 'Gym Norte',
      });

      mockRepository.findById.mockResolvedValue(gimnasioActual);
      mockRepository.findByNombre.mockResolvedValue(gimnasioConNombreExistente);

      await expect(useCase.execute(1, dto)).rejects.toThrow(ConflictError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundError si el gimnasio no existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(999, { nombre: 'Nuevo' })).rejects.toThrow(
        NotFoundError,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('debe permitir actualizar sin cambios de nombre (mismo nombre)', async () => {
      const dto = { nombre: 'Gym Central' }; // mismo nombre
      const gimnasioExistente = mockGimnasio({ id: 1, nombre: 'Gym Central' });
      const gimnasioActualizado = mockGimnasio({
        id: 1,
        nombre: 'Gym Central',
      });

      mockRepository.findById.mockResolvedValue(gimnasioExistente);
      mockRepository.findByNombre.mockResolvedValue(gimnasioExistente); // mismo gimnasio
      mockRepository.update.mockResolvedValue(gimnasioActualizado);

      const result = await useCase.execute(1, dto);

      expect(result.nombre).toBe('Gym Central');
    });
  });
});
