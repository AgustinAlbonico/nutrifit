import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ListarHistorialFichaSaludSocioUseCase } from './listar-historial-ficha-salud.use-case';
import {
  SocioOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  FICHA_SALUD_VERSION_REPOSITORY,
  FichaSaludVersionRepository,
} from 'src/domain/entities/FichaSalud/ficha-salud-version.repository';
import { FichaSaludVersionEntity } from 'src/domain/entities/FichaSalud/ficha-salud-version.entity';

describe('ListarHistorialFichaSaludSocioUseCase', () => {
  let useCase: ListarHistorialFichaSaludSocioUseCase;
  let usuarioRepository: jest.Mocked<Repository<UsuarioOrmEntity>>;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let fichaSaludVersionRepository: jest.Mocked<FichaSaludVersionRepository>;
  let logger: jest.Mocked<IAppLoggerService>;
  let tenantContext: TenantContextService;

  const mockUsuario = {
    idUsuario: 100,
    persona: { idPersona: 20 },
  } as unknown as UsuarioOrmEntity;

  const buildVersion = (
    id: number,
    version: number,
    createdAt: Date,
    createdBy: number | null = 100,
  ): FichaSaludVersionEntity =>
    new FichaSaludVersionEntity(
      id,
      500,
      20,
      version,
      { altura: 175, peso: 80 },
      createdAt,
      createdBy,
    );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarHistorialFichaSaludSocioUseCase,
        {
          provide: getRepositoryToken(UsuarioOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: FICHA_SALUD_VERSION_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            findByFichaId: jest.fn(),
            findByFichaIdAndVersion: jest.fn(),
            findMaxVersionByFichaId: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: { log: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<ListarHistorialFichaSaludSocioUseCase>(
      ListarHistorialFichaSaludSocioUseCase,
    );
    usuarioRepository = module.get(getRepositoryToken(UsuarioOrmEntity));
    socioRepository = module.get(getRepositoryToken(SocioOrmEntity));
    fichaSaludVersionRepository = module.get(FICHA_SALUD_VERSION_REPOSITORY);
    logger = module.get(APP_LOGGER_SERVICE);
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Casos felices', () => {
    it('retorna array de 3 versiones para socio con 3 versiones (orden DESC)', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 500 },
      } as unknown as SocioOrmEntity;

      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);

      const fecha1 = new Date('2026-01-01T10:00:00Z');
      const fecha2 = new Date('2026-02-01T10:00:00Z');
      const fecha3 = new Date('2026-03-01T10:00:00Z');
      jest
        .mocked(fichaSaludVersionRepository.findByFichaId)
        .mockResolvedValue([
          buildVersion(3, 3, fecha3),
          buildVersion(2, 2, fecha2),
          buildVersion(1, 1, fecha1),
        ]);

      const result = await useCase.execute(100);

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3);
      expect(result[1].version).toBe(2);
      expect(result[2].version).toBe(1);
      expect(result[0].versionId).toBe(3);
      expect(result[0].createdAt).toEqual(fecha3);
      expect(result[0].createdBy).toBe(100);
    });

    it('cada item NO incluye datosJson', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 500 },
      } as unknown as SocioOrmEntity;
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
      jest
        .mocked(fichaSaludVersionRepository.findByFichaId)
        .mockResolvedValue([buildVersion(1, 1, new Date())]);

      const result = await useCase.execute(100);

      // TypeScript ya garantiza la ausencia en compile-time;
      // verificamos que la salida cumple el DTO en runtime.
      const item = result[0] as unknown as Record<string, unknown>;
      expect(item).not.toHaveProperty('datosJson');
    });
  });

  describe('Casos de error', () => {
    it('lanza NotFoundError si el socio no tiene ficha', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: null,
      } as unknown as SocioOrmEntity;
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);

      await expect(useCase.execute(100)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Shape del DTO', () => {
    it('cada item expone exactamente 4 propiedades públicas', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 500 },
      } as unknown as SocioOrmEntity;
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
      jest
        .mocked(fichaSaludVersionRepository.findByFichaId)
        .mockResolvedValue([buildVersion(1, 1, new Date())]);

      const result = await useCase.execute(100);

      const item = result[0] as unknown as Record<string, unknown>;
      expect(Object.keys(item).sort()).toEqual(
        ['createdAt', 'createdBy', 'version', 'versionId'].sort(),
      );
    });
  });
});
