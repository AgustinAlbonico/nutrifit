import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GimnasioOrmEntity } from '../entities/gimnasio.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { GimnasioRepositoryImplementation } from './gimnasio.repository.impl';

describe('GimnasioRepositoryImplementation', () => {
  let repository: Repository<GimnasioOrmEntity>;
  let dataSource: DataSource;
  let impl: GimnasioRepositoryImplementation;

  const mockGimnasioOrm = (
    overrides: Partial<GimnasioOrmEntity> = {},
  ): GimnasioOrmEntity => ({
    idGimnasio: 1,
    nombre: 'Gym Central',
    direccion: 'Calle Principal 123',
    telefono: '1234567890',
    ciudad: 'Ciudad',
    logoUrl: null,
    colorPrimario: null,
    colorSecundario: null,
    plazoCancelacionHoras: 24,
    plazoReprogramacionHoras: 12,
    antelacionMinimaReservaHoras: 2,
    umbralAusenteMinutos: 15,
    emailNotificaciones: null,
    emailHabilitado: true,
    fechaBaja: null,
    turnos: [],
    ...overrides,
  });

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GimnasioRepositoryImplementation,
        {
          provide: getRepositoryToken(GimnasioOrmEntity),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: TenantContextService,
          useValue: {},
        },
      ],
    }).compile();

    impl = module.get<GimnasioRepositoryImplementation>(
      GimnasioRepositoryImplementation,
    );
    repository = module.get<Repository<GimnasioOrmEntity>>(
      getRepositoryToken(GimnasioOrmEntity),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar todos los gimnasios ordenados por nombre', async () => {
      const gimnasios = [
        mockGimnasioOrm({ idGimnasio: 1, nombre: 'Gym Central' }),
        mockGimnasioOrm({ idGimnasio: 2, nombre: 'Gym Norte' }),
      ];
      (repository.find as jest.Mock).mockResolvedValue(gimnasios);

      const result = await impl.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { nombre: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('debe retornar array vacio cuando no hay gimnasios', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      const result = await impl.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('debe retornar gimnasio cuando existe', async () => {
      const gimnasio = mockGimnasioOrm({ idGimnasio: 5 });
      (repository.findOne as jest.Mock).mockResolvedValue(gimnasio);

      const result = await impl.findById(5);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { idGimnasio: 5 },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe(5);
    });

    it('debe retornar null si no existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await impl.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('debe guardar un gimnasio nuevo', async () => {
      const saved = mockGimnasioOrm({ idGimnasio: 10 });
      (repository.save as jest.Mock).mockResolvedValue(saved);

      const {
        GimnasioEntity,
      } = require('src/domain/entities/Gimnasio/gimnasio.entity');
      const entity = new GimnasioEntity({
        id: 0,
        nombre: 'Gym Nuevo',
        direccion: 'Nueva Direccion',
        telefono: '111',
        email: null,
        fechaAlta: new Date(),
        fechaBaja: null,
      });

      const result = await impl.save(entity);

      expect(repository.save).toHaveBeenCalled();
      expect(result.id).toBe(10);
    });
  });

  describe('delete', () => {
    it('debe hacer soft delete (marcar como inactivo)', async () => {
      const gimnasio = mockGimnasioOrm({
        idGimnasio: 1,
        emailHabilitado: true,
      });
      (repository.findOne as jest.Mock).mockResolvedValue(gimnasio);
      (repository.save as jest.Mock).mockResolvedValue({
        ...gimnasio,
        emailHabilitado: false,
      });

      await impl.delete(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { idGimnasio: 1 },
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('debe lanzar error si el gimnasio no existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(impl.delete(999)).rejects.toThrow();
    });
  });

  describe('findByNombre', () => {
    it('debe buscar por nombre exacto', async () => {
      const gimnasio = mockGimnasioOrm({ nombre: 'Gym Central' });
      (repository.findOne as jest.Mock).mockResolvedValue(gimnasio);

      const result = await impl.findByNombre('Gym Central');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { nombre: 'Gym Central' },
      });
      expect(result).not.toBeNull();
    });

    it('debe retornar null si no existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await impl.findByNombre('No Existe');

      expect(result).toBeNull();
    });
  });

  describe('findActivos', () => {
    it('debe retornar solo gimnasios activos (emailHabilitado=true)', async () => {
      const gimnasios = [
        mockGimnasioOrm({
          idGimnasio: 1,
          nombre: 'Gym Central',
          emailHabilitado: true,
        }),
        mockGimnasioOrm({
          idGimnasio: 2,
          nombre: 'Gym Norte',
          emailHabilitado: true,
        }),
      ];
      (repository.find as jest.Mock).mockResolvedValue(gimnasios);

      const result = await impl.findActivos();

      expect(repository.find).toHaveBeenCalledWith({
        where: { emailHabilitado: true },
        order: { nombre: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });
});
