import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ListarHistorialFichaSaludNutricionistaUseCase } from './listar-historial-ficha-salud-nutricionista.use-case';
import {
  SocioOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  FICHA_SALUD_VERSION_REPOSITORY,
  FichaSaludVersionRepository,
} from 'src/domain/entities/FichaSalud/ficha-salud-version.repository';
import { FichaSaludVersionEntity } from 'src/domain/entities/FichaSalud/ficha-salud-version.entity';

describe('ListarHistorialFichaSaludNutricionistaUseCase (RB13)', () => {
  let useCase: ListarHistorialFichaSaludNutricionistaUseCase;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let fichaSaludVersionRepository: jest.Mocked<FichaSaludVersionRepository>;
  let logger: jest.Mocked<IAppLoggerService>;
  let tenantContext: TenantContextService;

  const buildVersion = (id: number, n: number): FichaSaludVersionEntity =>
    new FichaSaludVersionEntity(
      id,
      500,
      20,
      n,
      { altura: 175 },
      new Date(),
      100,
    );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarHistorialFichaSaludNutricionistaUseCase,
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { count: jest.fn() },
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

    useCase = module.get<ListarHistorialFichaSaludNutricionistaUseCase>(
      ListarHistorialFichaSaludNutricionistaUseCase,
    );
    socioRepository = module.get(getRepositoryToken(SocioOrmEntity));
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    fichaSaludVersionRepository = module.get(FICHA_SALUD_VERSION_REPOSITORY);
    logger = module.get(APP_LOGGER_SERVICE);
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RB13 — control de acceso', () => {
    it('lanza ForbiddenError si nutricionista NO tiene turno previo con el socio', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 500 },
      } as unknown as SocioOrmEntity;
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
      jest.mocked(turnoRepository.count).mockResolvedValue(0);

      await expect(useCase.execute(99, 20)).rejects.toThrow(ForbiddenError);
    });

    it('permite acceso si nutricionista tiene turno previo con el socio', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 500 },
      } as unknown as SocioOrmEntity;
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
      jest.mocked(turnoRepository.count).mockResolvedValue(1);
      jest
        .mocked(fichaSaludVersionRepository.findByFichaId)
        .mockResolvedValue([buildVersion(2, 2), buildVersion(1, 1)]);

      const result = await useCase.execute(99, 20);

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(2);
      expect(result[1].version).toBe(1);
    });
  });

  describe('Casos de error', () => {
    it('lanza NotFoundError si el socio no existe', async () => {
      jest.mocked(socioRepository.findOne).mockResolvedValue(null);

      await expect(useCase.execute(99, 20)).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si socio existe pero no tiene ficha', async () => {
      const socio = {
        idPersona: 20,
        gimnasioId: 1,
        fichaSalud: null,
      } as unknown as SocioOrmEntity;
      jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
      jest.mocked(turnoRepository.count).mockResolvedValue(1);

      await expect(useCase.execute(99, 20)).rejects.toThrow(NotFoundError);
    });
  });
});
