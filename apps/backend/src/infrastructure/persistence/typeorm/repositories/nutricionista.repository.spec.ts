import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { NutricionistaRepositoryImplementation } from './nutricionista.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

describe('NutricionistaRepositoryImplementation - tenant scoping', () => {
  let nutricionistaRepo: NutricionistaRepositoryImplementation;
  let mockNutricionistaRepository: jest.Mocked<
    Repository<NutricionistaOrmEntity>
  >;
  let mockTenantContext: jest.Mocked<TenantContextService>;

  const gimnasioIdMock = 5;
  const otroGimnasioId = 99;

  const mockNutricionista = (
    gimnasioId: number,
  ): Partial<NutricionistaOrmEntity> => ({
    idPersona: 1,
    nombre: 'Dr. Juan',
    apellido: 'Pérez',
    fechaNacimiento: new Date('1985-01-01'),
    telefono: '123456',
    genero: 'MASCULINO' as any,
    direccion: 'Calle 1',
    ciudad: 'Ciudad',
    provincia: 'Provincia',
    dni: '12345678',
    gimnasioId,
    fechaBaja: null,
    matricula: 'MAT-123',
    tarifaSesion: 500,
    aniosExperiencia: 10,
    usuario: { email: 'nutri@test.com' } as any,
  });

  beforeEach(async () => {
    mockNutricionistaRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockTenantContext = {
      get isInitialized() {
        return true;
      },
      get gimnasioId() {
        return gimnasioIdMock;
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutricionistaRepositoryImplementation,
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: mockNutricionistaRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
      ],
    }).compile();

    nutricionistaRepo = module.get<NutricionistaRepositoryImplementation>(
      NutricionistaRepositoryImplementation,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe filtrar por gimnasioId del tenant context', async () => {
      const nutricionistas = [mockNutricionista(gimnasioIdMock)];
      mockNutricionistaRepository.find.mockResolvedValue(
        nutricionistas as NutricionistaOrmEntity[],
      );

      const resultado = await nutricionistaRepo.findAll();

      expect(mockNutricionistaRepository.find).toHaveBeenCalledWith({
        where: { gimnasioId: gimnasioIdMock },
        relations: {
          usuario: true,
          agenda: true,
          formacionAcademica: true,
          certificaciones: true,
          diplomas: true,
          turnos: true,
        },
      });
      expect(resultado).toHaveLength(1);
    });

    it('debe lanzar error cuando tenant context no está inicializado', async () => {
      const mockTenantContextNoInit = {
        get gimnasioId() {
          throw new Error('not initialized');
        },
        isInitialized: false,
      } as unknown as TenantContextService;

      const moduleNoInit: TestingModule = await Test.createTestingModule({
        providers: [
          NutricionistaRepositoryImplementation,
          {
            provide: getRepositoryToken(NutricionistaOrmEntity),
            useValue: mockNutricionistaRepository,
          },
          {
            provide: TenantContextService,
            useValue: mockTenantContextNoInit,
          },
        ],
      }).compile();

      const repoNoInit =
        moduleNoInit.get<NutricionistaRepositoryImplementation>(
          NutricionistaRepositoryImplementation,
        );

      await expect(repoNoInit.findAll()).rejects.toThrow(
        'Tenant context not initialized',
      );
    });
  });

  describe('findById', () => {
    it('debe filtrar por id + gimnasioId del tenant context', async () => {
      const nutri = mockNutricionista(gimnasioIdMock);
      mockNutricionistaRepository.findOne.mockResolvedValue(
        nutri as NutricionistaOrmEntity,
      );

      const resultado = await nutricionistaRepo.findById(1);

      expect(mockNutricionistaRepository.findOne).toHaveBeenCalledWith({
        where: { idPersona: 1, gimnasioId: gimnasioIdMock },
        relations: {
          usuario: true,
          agenda: true,
          formacionAcademica: true,
          certificaciones: true,
          diplomas: true,
          turnos: true,
        },
      });
      expect(resultado).not.toBeNull();
    });

    it('debe retornar null si el nutricionista pertence a otro gimnasio', async () => {
      mockNutricionistaRepository.findOne.mockResolvedValue(null);

      const resultado = await nutricionistaRepo.findById(1);

      expect(resultado).toBeNull();
    });
  });

  describe('delete', () => {
    it('debe filtrar por id + gimnasioId al eliminar', async () => {
      mockNutricionistaRepository.delete.mockResolvedValue({
        affected: 1,
      } as any);

      await nutricionistaRepo.delete(1);

      expect(mockNutricionistaRepository.delete).toHaveBeenCalledWith({
        idPersona: 1,
        gimnasioId: gimnasioIdMock,
      });
    });

    it('debe lanzar error si el nutricionista no existe en este gimnasio', async () => {
      mockNutricionistaRepository.delete.mockResolvedValue({
        affected: 0,
      } as any);

      await expect(nutricionistaRepo.delete(999)).rejects.toThrow(
        'Nutricionista with id 999 not found in this gym',
      );
    });
  });
});
