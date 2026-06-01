import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocioOrmEntity } from '../entities/persona.entity';
import { SocioRepositoryImplementation } from './socio.respository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

describe('SocioRepositoryImplementation - tenant scoping', () => {
  let socioRepo: SocioRepositoryImplementation;
  let mockSocioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let mockTenantContext: jest.Mocked<TenantContextService>;

  const gimnasioIdMock = 5;
  const otroGimnasioId = 99;

  const mockSocioOrm = (gimnasioId: number): Partial<SocioOrmEntity> => ({
    idPersona: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    fechaNacimiento: new Date('1990-01-01'),
    telefono: '123456',
    genero: 'MASCULINO' as any,
    direccion: 'Calle 1',
    ciudad: 'Ciudad',
    provincia: 'Provincia',
    dni: '12345678',
    gimnasioId,
    fechaAlta: new Date(),
    fechaBaja: null,
    usuario: { email: 'juan@test.com' } as any,
  });

  beforeEach(async () => {
    mockSocioRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
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
        SocioRepositoryImplementation,
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: mockSocioRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
      ],
    }).compile();

    socioRepo = module.get<SocioRepositoryImplementation>(
      SocioRepositoryImplementation,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe filtrar por gimnasioId del tenant context', async () => {
      const sociosDelGimnasio = [
        mockSocioOrm(gimnasioIdMock),
        mockSocioOrm(gimnasioIdMock),
      ];
      const sociosDeOtroGimnasio = [mockSocioOrm(otroGimnasioId)];

      mockSocioRepository.find.mockResolvedValue(
        sociosDelGimnasio as SocioOrmEntity[],
      );

      const resultado = await socioRepo.findAll();

      expect(mockSocioRepository.find).toHaveBeenCalledWith({
        where: { gimnasioId: gimnasioIdMock },
        relations: ['usuario'],
        order: { idPersona: 'ASC' },
      });
      expect(resultado).toHaveLength(2);
    });

    it('debe lanzar error cuando tenant context no está inicializado', async () => {
      // Simular contexto no inicializado (isInitialized = false porque _gimnasioId es null)
      const mockTenantContextNoInit = {
        get gimnasioId() {
          throw new Error('not initialized');
        },
        isInitialized: false,
      } as unknown as TenantContextService;

      const moduleNoInit: TestingModule = await Test.createTestingModule({
        providers: [
          SocioRepositoryImplementation,
          {
            provide: getRepositoryToken(SocioOrmEntity),
            useValue: mockSocioRepository,
          },
          {
            provide: TenantContextService,
            useValue: mockTenantContextNoInit,
          },
        ],
      }).compile();

      const repoNoInit = moduleNoInit.get<SocioRepositoryImplementation>(
        SocioRepositoryImplementation,
      );

      await expect(repoNoInit.findAll()).rejects.toThrow(
        'Tenant context not initialized',
      );
    });
  });

  describe('findById', () => {
    it('debe filtrar por gimnasioId además del id', async () => {
      const socio = mockSocioOrm(gimnasioIdMock);
      mockSocioRepository.findOne.mockResolvedValue(socio as SocioOrmEntity);

      const resultado = await socioRepo.findById(1);

      expect(mockSocioRepository.findOne).toHaveBeenCalledWith({
        where: { idPersona: 1, gimnasioId: gimnasioIdMock },
      });
      expect(resultado).not.toBeNull();
    });

    it('debe retornar null si el socio pertenece a otro gimnasio', async () => {
      const socioDeOtroGym = mockSocioOrm(otroGimnasioId);
      mockSocioRepository.findOne.mockResolvedValue(null); // filtered out by DB

      const resultado = await socioRepo.findById(1);

      expect(resultado).toBeNull();
    });
  });

  describe('save', () => {
    it('debe usar gimnasioId del tenant context cuando entity no lo tiene', async () => {
      // No pasar gimnasioId en el entity para que use el del context
      const entityMock = {
        idPersona: null,
        nombre: 'Nuevo',
        apellido: 'Socio',
        fechaNacimiento: new Date(),
        telefono: '123',
        genero: 'MASCULINO' as any,
        direccion: 'Calle',
        ciudad: 'Ciudad',
        provincia: 'Provincia',
        dni: '87654321',
        // gimnasioId omitted -> cae en ?? this.gimnasioIdActual
        turnos: [],
        planesAlimentacion: [],
        fichaSalud: null,
      };

      mockSocioRepository.save.mockResolvedValue({
        ...mockSocioOrm(gimnasioIdMock),
        idPersona: 10,
      } as SocioOrmEntity);

      await socioRepo.save(entityMock as any);

      // El save debe usar el gimnasioId del context (5)
      const savedEntity = mockSocioRepository.save.mock.calls[0][0];
      expect(savedEntity.gimnasioId).toBe(gimnasioIdMock);
    });
  });

  describe('delete', () => {
    it('debe filtrar por gimnasioId al hacer baja lógica', async () => {
      mockSocioRepository.update.mockResolvedValue({ affected: 1 } as any);

      await socioRepo.delete(1);

      expect(mockSocioRepository.update).toHaveBeenCalledWith(
        { idPersona: 1, gimnasioId: gimnasioIdMock },
        { fechaBaja: expect.any(Date) },
      );
    });

    it('debe lanzar error si el socio no existe en este gimnasio', async () => {
      mockSocioRepository.update.mockResolvedValue({ affected: 0 } as any);

      await expect(socioRepo.delete(999)).rejects.toThrow(
        'Socio con id 999 no encontrado en este gimnasio',
      );
    });
  });
});
