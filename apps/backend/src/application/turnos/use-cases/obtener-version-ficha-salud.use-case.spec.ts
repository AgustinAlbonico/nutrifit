import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ObtenerVersionFichaSaludSocioUseCase } from './obtener-version-ficha-salud.use-case';
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

describe('ObtenerVersionFichaSaludSocioUseCase', () => {
  let useCase: ObtenerVersionFichaSaludSocioUseCase;
  let usuarioRepository: jest.Mocked<Repository<UsuarioOrmEntity>>;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let fichaSaludVersionRepository: jest.Mocked<FichaSaludVersionRepository>;
  let logger: jest.Mocked<IAppLoggerService>;
  let tenantContext: TenantContextService;

  const mockUsuario = {
    idUsuario: 100,
    persona: { idPersona: 20 },
  } as unknown as UsuarioOrmEntity;

  const buildVersionEntity = (
    id: number,
    version: number,
  ): FichaSaludVersionEntity =>
    new FichaSaludVersionEntity(
      id,
      500,
      20,
      version,
      { altura: 175, peso: 78, nivelActividadFisica: 'MODERADO' },
      new Date('2026-02-01T10:00:00Z'),
      100,
    );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObtenerVersionFichaSaludSocioUseCase,
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

    useCase = module.get<ObtenerVersionFichaSaludSocioUseCase>(
      ObtenerVersionFichaSaludSocioUseCase,
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
    it('retorna datos completos para versión existente', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 500 },
      } as unknown as SocioOrmEntity;
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
      jest
        .mocked(fichaSaludVersionRepository.findByFichaIdAndVersion)
        .mockResolvedValue(buildVersionEntity(2, 2));

      const result = await useCase.execute(100, 2);

      expect(result.version).toBe(2);
      expect(result.createdAt).toEqual(new Date('2026-02-01T10:00:00Z'));
      expect(result.datos).toEqual({
        altura: 175,
        peso: 78,
        nivelActividadFisica: 'MODERADO',
      });
    });

    it('datos se deserializa como objeto, no como string', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 500 },
      } as unknown as SocioOrmEntity;
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
      jest
        .mocked(fichaSaludVersionRepository.findByFichaIdAndVersion)
        .mockResolvedValue(buildVersionEntity(1, 1));

      const result = await useCase.execute(100, 1);

      expect(typeof result.datos).toBe('object');
      expect(result.datos).not.toBeNull();
    });
  });

  describe('Casos de error', () => {
    it('lanza NotFoundError si la versión no existe (n=99 con 2 versiones)', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 500 },
      } as unknown as SocioOrmEntity;
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
      jest
        .mocked(fichaSaludVersionRepository.findByFichaIdAndVersion)
        .mockResolvedValue(null);

      await expect(useCase.execute(100, 99)).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si socio no tiene ficha', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: null,
      } as unknown as SocioOrmEntity;
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);

      await expect(useCase.execute(100, 1)).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si n es 0 o negativo', async () => {
      await expect(useCase.execute(100, 0)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute(100, -1)).rejects.toThrow(NotFoundError);
    });
  });
});
