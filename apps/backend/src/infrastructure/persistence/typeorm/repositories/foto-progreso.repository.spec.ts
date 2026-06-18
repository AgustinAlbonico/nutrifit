import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FotoProgresoOrmEntity } from '../entities/foto-progreso.entity';
import { FotoProgresoRepository } from './foto-progreso.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { SocioOrmEntity } from '../entities/persona.entity';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
import { TurnoOrmEntity } from '../entities/turno.entity';

// Use string literal to avoid enum import issues in tests
const TIPO_FOTO_FRENTE = 'frente' as TipoFoto;

describe('FotoProgresoRepository - tenant scoping', () => {
  let fotoRepo: FotoProgresoRepository;
  let mockFotoRepository: jest.Mocked<Repository<FotoProgresoOrmEntity>>;
  let mockTenantContext: jest.Mocked<TenantContextService>;

  const gimnasioIdMock = 5;
  const otroGimnasioId = 99;

  const mockSocio = (gimnasioId: number): Partial<SocioOrmEntity> => ({
    idPersona: 1,
    nombre: 'Juan',
    gimnasioId,
    fechaBaja: null,
  });

  const mockTurno = (gimnasioId: number): Partial<TurnoOrmEntity> => ({
    idTurno: 22,
    fechaTurno: new Date('2026-06-18T00:00:00.000Z'),
    horaTurno: '10:00',
    gimnasio: { idGimnasio: gimnasioId } as TurnoOrmEntity['gimnasio'],
    socio: mockSocio(gimnasioId) as SocioOrmEntity,
  });

  const mockFotoProgreso = (
    gimnasioId: number,
  ): Partial<FotoProgresoOrmEntity> => ({
    idFoto: 1,
    socio: mockSocio(gimnasioId) as SocioOrmEntity,
    tipoFoto: TIPO_FOTO_FRENTE,
    objectKey: 'fotos/1 frontal.jpg',
    mimeType: 'image/jpeg',
    notas: null,
    fecha: new Date(),
    turno: mockTurno(gimnasioId) as TurnoOrmEntity,
  });

  beforeEach(async () => {
    mockFotoRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      manager: {
        findOne: jest.fn(),
      },
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
        FotoProgresoRepository,
        {
          provide: getRepositoryToken(FotoProgresoOrmEntity),
          useValue: mockFotoRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
      ],
    }).compile();

    fotoRepo = module.get<FotoProgresoRepository>(FotoProgresoRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findBySocioId', () => {
    it('debe filtrar por socio + gimnasioId del tenant context', async () => {
      const fotos = [
        mockFotoProgreso(gimnasioIdMock),
        mockFotoProgreso(gimnasioIdMock),
      ];
      mockFotoRepository.find.mockResolvedValue(
        fotos as FotoProgresoOrmEntity[],
      );

      const resultado = await fotoRepo.findBySocioId(1);

      expect(mockFotoRepository.find).toHaveBeenCalledWith({
        where: { socio: { idPersona: 1, gimnasioId: gimnasioIdMock } },
        relations: { socio: true, turno: true },
        order: { fecha: 'DESC' },
      });
      expect(resultado).toHaveLength(2);
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
          FotoProgresoRepository,
          {
            provide: getRepositoryToken(FotoProgresoOrmEntity),
            useValue: mockFotoRepository,
          },
          {
            provide: TenantContextService,
            useValue: mockTenantContextNoInit,
          },
        ],
      }).compile();

      const repoNoInit = moduleNoInit.get<FotoProgresoRepository>(
        FotoProgresoRepository,
      );

      await expect(repoNoInit.findBySocioId(1)).rejects.toThrow(
        'Tenant context not initialized',
      );
    });
  });

  describe('findByTurnoId', () => {
    it('debe filtrar por turno y gimnasioId del tenant context', async () => {
      const fotos = [mockFotoProgreso(gimnasioIdMock)];
      mockFotoRepository.find.mockResolvedValue(
        fotos as FotoProgresoOrmEntity[],
      );

      const resultado = await (
        fotoRepo as unknown as {
          findByTurnoId: (turnoId: number) => Promise<FotoProgresoOrmEntity[]>;
        }
      ).findByTurnoId(22);

      expect(mockFotoRepository.find).toHaveBeenCalledWith({
        where: {
          turno: { idTurno: 22, gimnasio: { idGimnasio: gimnasioIdMock } },
        },
        relations: { socio: true, turno: true },
        order: { fecha: 'DESC' },
      });
      expect(resultado).toHaveLength(1);
    });
  });

  describe('findByIdAndSocioId', () => {
    it('debe filtrar por id, socioId y gimnasioId', async () => {
      const foto = mockFotoProgreso(gimnasioIdMock);
      mockFotoRepository.findOne.mockResolvedValue(
        foto as FotoProgresoOrmEntity,
      );

      const resultado = await fotoRepo.findByIdAndSocioId(1, 1);

      expect(mockFotoRepository.findOne).toHaveBeenCalledWith({
        where: {
          idFoto: 1,
          socio: { idPersona: 1, gimnasioId: gimnasioIdMock },
        },
        relations: { socio: true, turno: true },
      });
      expect(resultado).not.toBeNull();
    });

    it('debe retornar null si la foto pertence a otro gimnasio', async () => {
      mockFotoRepository.findOne.mockResolvedValue(null);

      const resultado = await fotoRepo.findByIdAndSocioId(1, 1);

      expect(resultado).toBeNull();
    });
  });

  describe('save', () => {
    it('debe verificar que el socio pertenece al gimnasio actual', async () => {
      const entity = {
        socio: mockSocio(otroGimnasioId) as SocioOrmEntity,
        tipoFoto: TIPO_FOTO_FRENTE,
        objectKey: 'fotos/test.jpg',
        mimeType: 'image/jpeg',
      };

      await expect(
        fotoRepo.save(entity as Partial<FotoProgresoOrmEntity>),
      ).rejects.toThrow('Socio no pertenece al gimnasio actual');
    });

    it('debe usar gimnasioId del tenant context para la verificacion', async () => {
      const entity = {
        socio: mockSocio(gimnasioIdMock) as SocioOrmEntity,
        tipoFoto: TIPO_FOTO_FRENTE,
        objectKey: 'fotos/test.jpg',
        mimeType: 'image/jpeg',
      };
      const savedFoto = { ...entity, idFoto: 10 } as FotoProgresoOrmEntity;
      mockFotoRepository.create.mockReturnValue(
        entity as FotoProgresoOrmEntity,
      );
      mockFotoRepository.save.mockResolvedValue(savedFoto);

      const resultado = await fotoRepo.save(
        entity as Partial<FotoProgresoOrmEntity>,
      );

      expect(mockFotoRepository.create).toHaveBeenCalledWith(entity);
      expect(resultado.idFoto).toBe(10);
    });
  });

  describe('saveForSocio', () => {
    it('debe resolver socio y turno dentro del gimnasio actual antes de guardar', async () => {
      const socio = mockSocio(gimnasioIdMock) as SocioOrmEntity;
      const turno = mockTurno(gimnasioIdMock) as TurnoOrmEntity;
      const fotoCreada = {
        socio,
        turno,
        tipoFoto: TIPO_FOTO_FRENTE,
        notas: 'Sesion inicial',
        objectKey: 'fotos/test.jpg',
        mimeType: 'image/jpeg',
      } as FotoProgresoOrmEntity;
      const fotoGuardada = { ...fotoCreada, idFoto: 33 };
      jest
        .mocked(mockFotoRepository.manager.findOne)
        .mockResolvedValueOnce(socio)
        .mockResolvedValueOnce(turno);
      mockFotoRepository.create.mockReturnValue(fotoCreada);
      mockFotoRepository.save.mockResolvedValue(fotoGuardada);

      const resultado = await (
        fotoRepo as unknown as {
          saveForSocio: (
            entity: Partial<FotoProgresoOrmEntity> & {
              socioId: number;
              turnoId?: number;
            },
          ) => Promise<FotoProgresoOrmEntity>;
        }
      ).saveForSocio({
        socioId: 1,
        turnoId: 22,
        tipoFoto: TIPO_FOTO_FRENTE,
        notas: 'Sesion inicial',
        objectKey: 'fotos/test.jpg',
        mimeType: 'image/jpeg',
      });

      expect(mockFotoRepository.manager.findOne).toHaveBeenNthCalledWith(
        1,
        SocioOrmEntity,
        { where: { idPersona: 1, gimnasioId: gimnasioIdMock } },
      );
      expect(mockFotoRepository.manager.findOne).toHaveBeenNthCalledWith(
        2,
        TurnoOrmEntity,
        {
          where: {
            idTurno: 22,
            socio: { idPersona: 1, gimnasioId: gimnasioIdMock },
          },
          relations: { socio: true },
        },
      );
      expect(mockFotoRepository.create).toHaveBeenCalledWith({
        tipoFoto: TIPO_FOTO_FRENTE,
        notas: 'Sesion inicial',
        objectKey: 'fotos/test.jpg',
        mimeType: 'image/jpeg',
        socio,
        turno,
      });
      expect(resultado.idFoto).toBe(33);
    });

    it('debe rechazar un turno que no pertenece al socio o gimnasio actual', async () => {
      const socio = mockSocio(gimnasioIdMock) as SocioOrmEntity;
      jest
        .mocked(mockFotoRepository.manager.findOne)
        .mockResolvedValueOnce(socio)
        .mockResolvedValueOnce(null);

      await expect(
        (
          fotoRepo as unknown as {
            saveForSocio: (
              entity: Partial<FotoProgresoOrmEntity> & {
                socioId: number;
                turnoId?: number;
              },
            ) => Promise<FotoProgresoOrmEntity>;
          }
        ).saveForSocio({
          socioId: 1,
          turnoId: 99,
          tipoFoto: TIPO_FOTO_FRENTE,
          objectKey: 'fotos/test.jpg',
          mimeType: 'image/jpeg',
        }),
      ).rejects.toThrow('Turno no pertenece al socio o gimnasio actual');
    });
  });

  describe('delete', () => {
    it('debe verificar que la foto pertenece al gimnasio antes de eliminar', async () => {
      const foto = mockFotoProgreso(gimnasioIdMock);
      mockFotoRepository.findOne.mockResolvedValue(
        foto as FotoProgresoOrmEntity,
      );
      mockFotoRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await fotoRepo.delete(1);

      expect(mockFotoRepository.findOne).toHaveBeenCalledWith({
        where: { idFoto: 1, socio: { gimnasioId: gimnasioIdMock } },
        relations: { socio: true },
      });
      expect(mockFotoRepository.delete).toHaveBeenCalledWith(1);
    });

    it('debe lanzar error si la foto no existe en este gimnasio', async () => {
      mockFotoRepository.findOne.mockResolvedValue(null);

      await expect(fotoRepo.delete(999)).rejects.toThrow(
        'Foto with id 999 not found in this gym',
      );
    });
  });
});
