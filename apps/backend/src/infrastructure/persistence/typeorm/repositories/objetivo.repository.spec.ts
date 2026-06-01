import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjetivoOrmEntity } from '../entities/objetivo.entity';
import { ObjetivoRepository } from './objetivo.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { SocioOrmEntity } from '../entities/persona.entity';
import {
  EstadoObjetivo,
  TipoMetrica,
} from 'src/domain/entities/Objetivo/objetivo.entity';

describe('ObjetivoRepository - tenant scoping', () => {
  let objetivoRepo: ObjetivoRepository;
  let mockObjetivoRepository: jest.Mocked<Repository<ObjetivoOrmEntity>>;
  let mockTenantContext: jest.Mocked<TenantContextService>;

  const gimnasioIdMock = 5;
  const otroGimnasioId = 99;

  const mockSocio = (gimnasioId: number): Partial<SocioOrmEntity> => ({
    idPersona: 1,
    nombre: 'Juan',
    gimnasioId,
    fechaBaja: null,
  });

  const mockObjetivo = (gimnasioId: number): Partial<ObjetivoOrmEntity> => ({
    idObjetivo: 1,
    socio: mockSocio(gimnasioId) as SocioOrmEntity,
    socioId: 1,
    tipoMetrica: 'PESO' as TipoMetrica,
    valorInicial: 85,
    valorObjetivo: 80,
    valorActual: 83,
    estado: 'ACTIVO' as EstadoObjetivo,
    fechaInicio: new Date(),
    fechaObjetivo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockObjetivoRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
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
        ObjetivoRepository,
        {
          provide: getRepositoryToken(ObjetivoOrmEntity),
          useValue: mockObjetivoRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
      ],
    }).compile();

    objetivoRepo = module.get<ObjetivoRepository>(ObjetivoRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('debe filtrar por id + gimnasioId del tenant context', async () => {
      const objetivo = mockObjetivo(gimnasioIdMock);
      mockObjetivoRepository.findOne.mockResolvedValue(
        objetivo as ObjetivoOrmEntity,
      );

      const resultado = await objetivoRepo.findById(1);

      expect(mockObjetivoRepository.findOne).toHaveBeenCalledWith({
        where: { idObjetivo: 1, socio: { gimnasioId: gimnasioIdMock } },
        relations: { socio: true },
      });
      expect(resultado).not.toBeNull();
    });

    it('debe retornar null si el objetivo pertence a otro gimnasio', async () => {
      mockObjetivoRepository.findOne.mockResolvedValue(null);

      const resultado = await objetivoRepo.findById(1);

      expect(resultado).toBeNull();
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
          ObjetivoRepository,
          {
            provide: getRepositoryToken(ObjetivoOrmEntity),
            useValue: mockObjetivoRepository,
          },
          {
            provide: TenantContextService,
            useValue: mockTenantContextNoInit,
          },
        ],
      }).compile();

      const repoNoInit =
        moduleNoInit.get<ObjetivoRepository>(ObjetivoRepository);

      await expect(repoNoInit.findById(1)).rejects.toThrow(
        'Tenant context not initialized',
      );
    });
  });

  describe('findActivosBySocioId', () => {
    it('debe filtrar por socioId, estado ACTIVO y gimnasioId', async () => {
      const objetivos = [mockObjetivo(gimnasioIdMock)];
      mockObjetivoRepository.find.mockResolvedValue(
        objetivos as ObjetivoOrmEntity[],
      );

      const resultado = await objetivoRepo.findActivosBySocioId(1);

      expect(mockObjetivoRepository.find).toHaveBeenCalledWith({
        where: {
          socio: { idPersona: 1, gimnasioId: gimnasioIdMock },
          estado: 'ACTIVO',
        },
        relations: { socio: true },
        order: { createdAt: 'DESC' },
      });
      expect(resultado).toHaveLength(1);
    });
  });

  describe('save', () => {
    it('debe verificar que el socio pertenece al gimnasio actual', async () => {
      const entity = {
        socio: mockSocio(otroGimnasioId) as SocioOrmEntity,
        tipoMetrica: 'PESO' as TipoMetrica,
        valorInicial: 85,
        valorObjetivo: 80,
        valorActual: 83,
        estado: 'ACTIVO' as EstadoObjetivo,
      };

      await expect(
        objetivoRepo.save(entity as Partial<ObjetivoOrmEntity>),
      ).rejects.toThrow('Socio no pertenece al gimnasio actual');
    });

    it('debe crear y guardar el objetivo cuando el socio pertenece al gimnasio', async () => {
      const entity = {
        socio: mockSocio(gimnasioIdMock) as SocioOrmEntity,
        tipoMetrica: 'PESO' as TipoMetrica,
        valorInicial: 85,
        valorObjetivo: 80,
        valorActual: 83,
        estado: 'ACTIVO' as EstadoObjetivo,
      };
      const savedObjetivo = { ...entity, idObjetivo: 10 } as ObjetivoOrmEntity;
      mockObjetivoRepository.create.mockReturnValue(
        entity as ObjetivoOrmEntity,
      );
      mockObjetivoRepository.save.mockResolvedValue(savedObjetivo);

      const resultado = await objetivoRepo.save(
        entity as Partial<ObjetivoOrmEntity>,
      );

      expect(mockObjetivoRepository.create).toHaveBeenCalledWith(entity);
      expect(resultado.idObjetivo).toBe(10);
    });
  });

  describe('updateEstado', () => {
    it('debe verificar que el objetivo pertenece al gimnasio antes de actualizar', async () => {
      const objetivo = mockObjetivo(gimnasioIdMock);
      mockObjetivoRepository.findOne.mockResolvedValue(
        objetivo as ObjetivoOrmEntity,
      );
      mockObjetivoRepository.update.mockResolvedValue({ affected: 1 } as any);

      await objetivoRepo.updateEstado(1, 'COMPLETADO');

      expect(mockObjetivoRepository.findOne).toHaveBeenCalledWith({
        where: { idObjetivo: 1, socio: { gimnasioId: gimnasioIdMock } },
      });
      expect(mockObjetivoRepository.update).toHaveBeenCalledWith(1, {
        estado: 'COMPLETADO',
        updatedAt: expect.any(Date),
      });
    });

    it('debe lanzar error si el objetivo no existe en este gimnasio', async () => {
      mockObjetivoRepository.findOne.mockResolvedValue(null);

      await expect(
        objetivoRepo.updateEstado(999, 'COMPLETADO'),
      ).rejects.toThrow('Objetivo with id 999 not found in this gym');
    });
  });
});
