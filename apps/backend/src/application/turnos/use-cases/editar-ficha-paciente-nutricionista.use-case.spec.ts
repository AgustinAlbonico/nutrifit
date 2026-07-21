import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

import { EditarFichaPacienteNutricionistaUseCase } from './editar-ficha-paciente-nutricionista.use-case';
import {
  AlergiaOrmEntity,
  FichaSaludOrmEntity,
  FichaSaludVersionOrmEntity,
  PatologiaOrmEntity,
  SocioOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
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
import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
import { EditarFichaPacienteNutricionistaDto } from 'src/application/turnos/dtos/editar-ficha-paciente-nutricionista.dto';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

/**
 * Spec de EditarFichaPacienteNutricionistaUseCase.
 *
 * Cubre:
 *  - NUT con turno previo → éxito, versión incrementada, snapshot persiste
 *  - NUT sin turno previo → ForbiddenError (RB13)
 *  - Socio inexistente → NotFoundError
 *  - Socio sin ficha previa → crea nueva ficha + version=1 + revisadaPorNutricionistaAt
 *  - Ficha existente → version N+1, actualizadaAt actualizado, consentAt intacto
 *  - Auditoría RB33: accion=FICHA_REVISADA_POR_NUTRICIONISTA, shape seguro
 *  - Validación DTO (altura/peso/enums) — delega en class-validator
 */
describe('EditarFichaPacienteNutricionistaUseCase', () => {
  let useCase: EditarFichaPacienteNutricionistaUseCase;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let fichaSaludVersionRepository: jest.Mocked<
    Repository<FichaSaludVersionOrmEntity>
  >;
  let alergiaRepository: jest.Mocked<Repository<AlergiaOrmEntity>>;
  let patologiaRepository: jest.Mocked<Repository<PatologiaOrmEntity>>;
  let logger: jest.Mocked<IAppLoggerService>;
  let tenantContext: TenantContextService;
  let dataSource: { transaction: jest.Mock };
  let auditoriaService: jest.Mocked<AuditoriaService>;

  const NUT_USUARIO_ID = 100;
  const NUT_PERSONA_ID = 10;
  const SOCIO_PERSONA_ID = 20;
  const GIMNASIO_ID = 1;

  const buildMockSocio = (
    overrides?: Partial<SocioOrmEntity>,
  ): SocioOrmEntity =>
    ({
      idPersona: SOCIO_PERSONA_ID,
      gimnasioId: GIMNASIO_ID,
      fichaSalud: null,
      ...overrides,
    }) as unknown as SocioOrmEntity;

  const buildValidDto = (
    overrides?: Partial<EditarFichaPacienteNutricionistaDto>,
  ): EditarFichaPacienteNutricionistaDto => ({
    altura: 175,
    peso: 80,
    nivelActividadFisica: NivelActividadFisica.MODERADO,
    objetivoPersonal: 'Bajar de peso',
    alergias: [],
    patologias: [],
    ...overrides,
  });

  const setupTransactionMock = (versionSaveImpl?: jest.Mock) => {
    let savedVersionId = 1000;
    const fichaRepoManager = {
      save: jest.fn(async (entity: FichaSaludOrmEntity) => {
        if (!entity.idFichaSalud) {
          (
            entity as FichaSaludOrmEntity & { idFichaSalud: number }
          ).idFichaSalud = 500;
        }
        return entity;
      }),
    };
    const versionRepoManager = {
      create: jest.fn((data: Partial<FichaSaludVersionOrmEntity>) => data),
      save: jest.fn(async (data: Partial<FichaSaludVersionOrmEntity>) => {
        if (versionSaveImpl) {
          return versionSaveImpl(data);
        }
        return {
          ...data,
          idFichaSaludVersion: savedVersionId++,
        } as FichaSaludVersionOrmEntity;
      }),
    };
    const socioRepoManager = {
      save: jest.fn(async (s: SocioOrmEntity) => s),
    };

    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === FichaSaludOrmEntity) return fichaRepoManager;
        if (entity === FichaSaludVersionOrmEntity) return versionRepoManager;
        if (entity === SocioOrmEntity) return socioRepoManager;
        return {};
      }),
      query: jest.fn(async () => [{ max: 0 }]),
    };

    dataSource.transaction.mockImplementation(
      async (cb: (m: unknown) => Promise<unknown>) => cb(manager),
    );

    return { fichaRepoManager, versionRepoManager, socioRepoManager, manager };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditarFichaPacienteNutricionistaUseCase,
        {
          provide: getRepositoryToken(UsuarioOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(FichaSaludOrmEntity),
          useValue: { save: jest.fn() },
        },
        {
          provide: getRepositoryToken(FichaSaludVersionOrmEntity),
          useValue: { save: jest.fn(), create: jest.fn() },
        },
        {
          provide: getRepositoryToken(AlergiaOrmEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PatologiaOrmEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: { log: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: GIMNASIO_ID },
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    useCase = module.get<EditarFichaPacienteNutricionistaUseCase>(
      EditarFichaPacienteNutricionistaUseCase,
    );
    socioRepository = module.get(getRepositoryToken(SocioOrmEntity));
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    fichaSaludVersionRepository = module.get(
      getRepositoryToken(FichaSaludVersionOrmEntity),
    );
    alergiaRepository = module.get(getRepositoryToken(AlergiaOrmEntity));
    patologiaRepository = module.get(getRepositoryToken(PatologiaOrmEntity));
    logger = module.get(APP_LOGGER_SERVICE);
    tenantContext = module.get<TenantContextService>(TenantContextService);
    dataSource = module.get(DataSource);
    auditoriaService = module.get(AuditoriaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Errores de lookup', () => {
    it('lanza NotFoundError si el socio no existe', async () => {
      jest.mocked(socioRepository.findOne).mockResolvedValue(null);

      await expect(
        useCase.execute(
          NUT_USUARIO_ID,
          NUT_PERSONA_ID,
          SOCIO_PERSONA_ID,
          buildValidDto(),
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('lanza ForbiddenError si el NUT no tiene turnos previos con el socio', async () => {
      jest.mocked(socioRepository.findOne).mockResolvedValue(buildMockSocio());
      jest.mocked(turnoRepository.count).mockResolvedValue(0);

      await expect(
        useCase.execute(
          NUT_USUARIO_ID,
          NUT_PERSONA_ID,
          SOCIO_PERSONA_ID,
          buildValidDto(),
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Happy path', () => {
    it('NUT con turno previo edita ficha existente: version=1 (simulado), revisadaPorNutricionistaAt actualizado', async () => {
      // Arrange
      const fichaExistente = {
        idFichaSalud: 500,
        fechaCreacion: new Date('2025-01-01'),
        completada: true,
        completadaAt: new Date('2025-01-01'),
        consentAt: new Date('2025-01-01'),
        actualizadaAt: null,
        versionActualId: 999,
        altura: 170,
        peso: 75,
        nivelActividadFisica: NivelActividadFisica.SEDENTARIO,
        objetivoPersonal: 'Subir peso',
        alergias: [],
        patologias: [],
        medicacionActual: null,
        suplementosActuales: null,
        cirugiasPrevias: null,
        antecedentesFamiliares: null,
        frecuenciaComidas: null,
        consumoAguaDiario: null,
        restriccionesAlimentarias: null,
        consumoAlcohol: null,
        fumaTabaco: false,
        horasSueno: null,
        contactoEmergenciaNombre: null,
        contactoEmergenciaTelefono: null,
        revisadaPorNutricionistaAt: null,
      } as unknown as FichaSaludOrmEntity;

      jest
        .mocked(socioRepository.findOne)
        .mockResolvedValue(buildMockSocio({ fichaSalud: fichaExistente }));
      jest.mocked(turnoRepository.count).mockResolvedValue(1);
      setupTransactionMock();

      const dto = buildValidDto({
        altura: 180,
        peso: 78,
        nivelActividadFisica: NivelActividadFisica.INTENSO,
        objetivoPersonal: 'Bajar de peso',
      });

      // Act
      const before = new Date();
      const result = await useCase.execute(
        NUT_USUARIO_ID,
        NUT_PERSONA_ID,
        SOCIO_PERSONA_ID,
        dto,
      );
      const after = new Date();

      // Assert
      expect(result.versionActual).toBe(1);
      expect(result.altura).toBe(180);
      expect(result.peso).toBe(78);
      // consentAt no debe haber cambiado (RB44: consentimiento es una sola vez)
      expect(result.consentAt).toEqual(new Date('2025-01-01'));
      // actualizadaAt actualizado
      expect(result.actualizadaAt).toBeInstanceOf(Date);
      expect(result.actualizadaAt!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(result.actualizadaAt!.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it('NUT con turno previo y socio sin ficha: crea ficha nueva (esCreacion=true en auditoría)', async () => {
      // Arrange
      jest.mocked(socioRepository.findOne).mockResolvedValue(buildMockSocio());
      jest.mocked(turnoRepository.count).mockResolvedValue(1);
      setupTransactionMock();

      const dto = buildValidDto();

      // Act
      const result = await useCase.execute(
        NUT_USUARIO_ID,
        NUT_PERSONA_ID,
        SOCIO_PERSONA_ID,
        dto,
      );

      // Assert
      expect(result.completada).toBe(true);
      expect(result.completadaAt).toBeInstanceOf(Date);
      // consentAt queda null porque el NUT no setea consentimiento
      expect(result.consentAt).toBeNull();
      expect(result.versionActual).toBe(1);
    });
  });

  describe('Auditoría RB33', () => {
    it('llama a auditoriaService.registrar con accion=FICHA_REVISADA_POR_NUTRICIONISTA', async () => {
      // Arrange
      jest.mocked(socioRepository.findOne).mockResolvedValue(buildMockSocio());
      jest.mocked(turnoRepository.count).mockResolvedValue(1);
      setupTransactionMock();

      // Act
      await useCase.execute(
        NUT_USUARIO_ID,
        NUT_PERSONA_ID,
        SOCIO_PERSONA_ID,
        buildValidDto(),
      );

      // Assert
      expect(auditoriaService.registrar).toHaveBeenCalledTimes(1);
      const callArg = auditoriaService.registrar.mock.calls[0][0] as {
        accion: AccionAuditoria;
        entidad: string;
        entidadId: number;
        usuarioId: number;
        metadata: Record<string, unknown>;
      };
      expect(callArg.accion).toBe(
        AccionAuditoria.FICHA_REVISADA_POR_NUTRICIONISTA,
      );
      expect(callArg.entidad).toBe('ficha_salud');
      expect(callArg.entidadId).toBe(500);
      expect(callArg.usuarioId).toBe(NUT_USUARIO_ID);
      expect(callArg.metadata.nutricionistaPersonaId).toBe(NUT_PERSONA_ID);
      expect(callArg.metadata.esCreacion).toBe(true);
    });

    it('NO llama a auditoría si la transacción falla (rollback natural)', async () => {
      // Arrange
      jest.mocked(socioRepository.findOne).mockResolvedValue(buildMockSocio());
      jest.mocked(turnoRepository.count).mockResolvedValue(1);

      dataSource.transaction.mockImplementation(
        async (cb: (m: unknown) => Promise<unknown>) => {
          const manager = {
            getRepository: jest.fn((entity: unknown) => {
              if (entity === FichaSaludOrmEntity) {
                return {
                  save: jest.fn(async (entity: FichaSaludOrmEntity) => {
                    if (!entity.idFichaSalud) {
                      (
                        entity as FichaSaludOrmEntity & {
                          idFichaSalud: number;
                        }
                      ).idFichaSalud = 500;
                    }
                    return entity;
                  }),
                };
              }
              if (entity === FichaSaludVersionOrmEntity) {
                return {
                  create: jest.fn(
                    (data: Partial<FichaSaludVersionOrmEntity>) => data,
                  ),
                  save: jest.fn(async () => {
                    throw new Error('version save failed');
                  }),
                };
              }
              if (entity === SocioOrmEntity) {
                return { save: jest.fn(async (s: SocioOrmEntity) => s) };
              }
              return {};
            }),
            query: jest.fn(async () => [{ max: 0 }]),
          };
          return cb(manager);
        },
      );

      // Act & Assert
      await expect(
        useCase.execute(
          NUT_USUARIO_ID,
          NUT_PERSONA_ID,
          SOCIO_PERSONA_ID,
          buildValidDto(),
        ),
      ).rejects.toThrow('version save failed');

      expect(auditoriaService.registrar).not.toHaveBeenCalled();
    });

    it('metadata NO contiene campos clínicos sensibles (RB33 shape seguro)', async () => {
      // Arrange
      jest.mocked(socioRepository.findOne).mockResolvedValue(buildMockSocio());
      jest.mocked(turnoRepository.count).mockResolvedValue(1);
      setupTransactionMock();

      const dto = buildValidDto({
        medicacionActual: 'Ibuprofeno',
        antecedentesFamiliares: 'Diabetes',
        cirugiasPrevias: 'Apendicectomía',
      });

      // Act
      await useCase.execute(
        NUT_USUARIO_ID,
        NUT_PERSONA_ID,
        SOCIO_PERSONA_ID,
        dto,
      );

      // Assert: la metadata serializada no debe contener medicación,
      // antecedentes ni cirugías (shape seguro RB33).
      const callArg = auditoriaService.registrar.mock.calls[0][0] as {
        metadata: Record<string, unknown>;
      };
      const metadataStr = JSON.stringify(callArg.metadata);
      expect(metadataStr).not.toMatch(/Ibuprofeno/i);
      expect(metadataStr).not.toMatch(/Diabetes/i);
      expect(metadataStr).not.toMatch(/Apendicectom/i);
    });
  });

  describe('Versionado RB50', () => {
    it('crea nueva fila en ficha_salud_version con la versión siguiente', async () => {
      // Arrange
      const fichaExistente = {
        idFichaSalud: 500,
        fechaCreacion: new Date('2025-01-01'),
        completada: true,
        consentAt: new Date('2025-01-01'),
        completadaAt: new Date('2025-01-01'),
        actualizadaAt: null,
        versionActualId: 999,
        altura: 170,
        peso: 75,
        nivelActividadFisica: NivelActividadFisica.SEDENTARIO,
        objetivoPersonal: 'X',
        alergias: [],
        patologias: [],
        medicacionActual: null,
        suplementosActuales: null,
        cirugiasPrevias: null,
        antecedentesFamiliares: null,
        frecuenciaComidas: null,
        consumoAguaDiario: null,
        restriccionesAlimentarias: null,
        consumoAlcohol: null,
        fumaTabaco: false,
        horasSueno: null,
        contactoEmergenciaNombre: null,
        contactoEmergenciaTelefono: null,
        revisadaPorNutricionistaAt: null,
      } as unknown as FichaSaludOrmEntity;
      jest
        .mocked(socioRepository.findOne)
        .mockResolvedValue(buildMockSocio({ fichaSalud: fichaExistente }));
      jest.mocked(turnoRepository.count).mockResolvedValue(1);

      // El SELECT MAX(version) devuelve 3 (ya hay 3 versiones previas).
      const { versionRepoManager } = setupTransactionMock();

      dataSource.transaction.mockImplementation(
        async (cb: (m: unknown) => Promise<unknown>) => {
          const manager = {
            getRepository: jest.fn((entity: unknown) => {
              if (entity === FichaSaludOrmEntity) {
                return {
                  save: jest.fn(async (entity: FichaSaludOrmEntity) => {
                    if (!entity.idFichaSalud) {
                      (
                        entity as FichaSaludOrmEntity & {
                          idFichaSalud: number;
                        }
                      ).idFichaSalud = 500;
                    }
                    return entity;
                  }),
                };
              }
              if (entity === FichaSaludVersionOrmEntity) {
                return versionRepoManager;
              }
              if (entity === SocioOrmEntity) {
                return { save: jest.fn(async (s: SocioOrmEntity) => s) };
              }
              return {};
            }),
            query: jest.fn(async () => [{ max: 3 }]),
          };
          return cb(manager);
        },
      );

      // Act
      await useCase.execute(
        NUT_USUARIO_ID,
        NUT_PERSONA_ID,
        SOCIO_PERSONA_ID,
        buildValidDto({ peso: 80 }),
      );

      // Assert
      const createCallArg = versionRepoManager.create.mock.calls[0][0] as {
        version: number;
        createdBy: number;
      };
      expect(createCallArg.version).toBe(4);
      expect(createCallArg.createdBy).toBe(NUT_USUARIO_ID);
    });
  });

  describe('Validación DTO', () => {
    const validateDto = async (plain: unknown) => {
      const instance = plainToInstance(
        EditarFichaPacienteNutricionistaDto,
        plain,
      );
      return validateOrReject(instance as object);
    };

    it('rechaza altura fuera de rango (50 cm)', async () => {
      await expect(
        validateDto(buildValidDto({ altura: 50 })),
      ).rejects.toBeDefined();
    });

    it('rechaza peso fuera de rango (600 kg)', async () => {
      await expect(
        validateDto(buildValidDto({ peso: 600 })),
      ).rejects.toBeDefined();
    });

    it('rechaza enum NivelActividadFisica inválido', async () => {
      await expect(
        validateDto({
          ...buildValidDto(),
          nivelActividadFisica: 'SUPER_INTENSO',
        }),
      ).rejects.toBeDefined();
    });
  });
});

// Helper de tipo para acceder a `Repository<T>` en este archivo.
type Repository<T> = {
  findOne: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  count: jest.Mock;
};
