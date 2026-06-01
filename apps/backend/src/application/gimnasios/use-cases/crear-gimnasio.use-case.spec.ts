import { Test, TestingModule } from '@nestjs/testing';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import { CrearGimnasioUseCase } from './crear-gimnasio.use-case';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';

describe('CrearGimnasioUseCase', () => {
  let useCase: CrearGimnasioUseCase;
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
      findByNombre: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<GimnasioRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrearGimnasioUseCase,
        { provide: GIMNASIO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get<CrearGimnasioUseCase>(CrearGimnasioUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  describe('execute', () => {
    it('debe crear un gimnasio exitosamente cuando el nombre no existe', async () => {
      const crearDto = {
        nombre: 'Gym Central',
        direccion: 'Calle Principal 123',
        telefono: '1234567890',
      };
      const gimnasioCreado = mockGimnasio({ nombre: 'Gym Central' });

      mockRepository.findByNombre.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(gimnasioCreado);

      const result = await useCase.execute(crearDto);

      expect(mockRepository.findByNombre).toHaveBeenCalledWith('Gym Central');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.nombre).toBe('Gym Central');
      expect(result.direccion).toBe('Calle Principal 123');
    });

    it('debe lanzar ConflictError cuando el nombre del gimnasio ya existe', async () => {
      const crearDto = {
        nombre: 'Gym Central',
        direccion: 'Calle Principal 123',
      };
      const gimnasioExistente = mockGimnasio({ nombre: 'Gym Central' });

      mockRepository.findByNombre.mockResolvedValue(gimnasioExistente);

      await expect(useCase.execute(crearDto)).rejects.toThrow(ConflictError);
      await expect(useCase.execute(crearDto)).rejects.toThrow(
        'Ya existe un gimnasio con el nombre "Gym Central"',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debe crear gimnasio sin telefono ni email', async () => {
      const crearDto = {
        nombre: 'Gym Norte',
        direccion: 'Av. Secundario 456',
      };
      const gimnasioCreado = mockGimnasio({
        id: 2,
        nombre: 'Gym Norte',
        direccion: 'Av. Secundario 456',
        telefono: null,
      });

      mockRepository.findByNombre.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(gimnasioCreado);

      const result = await useCase.execute(crearDto);

      expect(result.telefono).toBeNull();
      expect(result.email).toBeNull();
    });
  });
});