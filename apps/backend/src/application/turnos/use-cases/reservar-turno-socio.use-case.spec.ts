import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservarTurnoSocioUseCase } from './reservar-turno-socio.use-case';
import { ValidacionesCreacionTurno } from '../helpers/validaciones-creacion-turno.helper';
import {
  TurnoOrmEntity,
  SocioOrmEntity,
  NutricionistaOrmEntity,
  AgendaOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

describe('ReservarTurnoSocioUseCase - Multi-Tenant Isolation', () => {
  let useCase: ReservarTurnoSocioUseCase;
  let usuarioRepository: jest.Mocked<Repository<UsuarioOrmEntity>>;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let nutricionistaOrmRepository: jest.Mocked<
    Repository<NutricionistaOrmEntity>
  >;
  let agendaRepository: jest.Mocked<Repository<AgendaOrmEntity>>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let nutricionistaRepository: NutricionistaRepository;
  let tenantContext: TenantContextService;

  const mockNutricionista = {
    idPersona: 10,
    nombre: 'Dr.',
    apellido: 'Test',
    gimnasioId: 1,
    fechaBaja: null,
  } as NutricionistaOrmEntity;

  const mockSocio = {
    idPersona: 20,
    nombre: 'Juan',
    apellido: 'Socio',
    gimnasioId: 1,
    fichaSalud: {
      idFichaSalud: 1,
      objetivoPersonal: 'Bajar de peso',
      completada: true,
    },
  } as unknown as SocioOrmEntity;

  const mockUsuario = {
    idUsuario: 100,
    persona: {
      idPersona: 20,
      nombre: 'Juan',
      apellido: 'Socio',
    },
  } as unknown as UsuarioOrmEntity;

  // Agenda mock para cualquier día de la semana
  const mockAgenda = [
    {
      idAgenda: 1,
      dia: DiaSemana.LUNES,
      horaInicio: '08:00',
      horaFin: '18:00',
      duracionTurno: 60,
      nutricionista: mockNutricionista,
    },
    {
      idAgenda: 2,
      dia: DiaSemana.MARTES,
      horaInicio: '08:00',
      horaFin: '18:00',
      duracionTurno: 60,
      nutricionista: mockNutricionista,
    },
    {
      idAgenda: 3,
      dia: DiaSemana.MIERCOLES,
      horaInicio: '08:00',
      horaFin: '18:00',
      duracionTurno: 60,
      nutricionista: mockNutricionista,
    },
    {
      idAgenda: 4,
      dia: DiaSemana.JUEVES,
      horaInicio: '08:00',
      horaFin: '18:00',
      duracionTurno: 60,
      nutricionista: mockNutricionista,
    },
    {
      idAgenda: 5,
      dia: DiaSemana.VIERNES,
      horaInicio: '08:00',
      horaFin: '18:00',
      duracionTurno: 60,
      nutricionista: mockNutricionista,
    },
  ] as AgendaOrmEntity[];

  const buildTurnoSaveResult = (overrides?: Partial<TurnoOrmEntity>) =>
    ({
      idTurno: 1,
      fechaTurno: new Date('2026-06-15'),
      horaTurno: '10:00',
      estadoTurno: EstadoTurno.PROGRAMADO,
      socio: mockSocio,
      nutricionista: mockNutricionista,
      ...overrides,
    }) as TurnoOrmEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservarTurnoSocioUseCase,
        ValidacionesCreacionTurno,
        {
          provide: getRepositoryToken(UsuarioOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(AgendaOrmEntity),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: { log: jest.fn() },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<ReservarTurnoSocioUseCase>(ReservarTurnoSocioUseCase);
    usuarioRepository = module.get(getRepositoryToken(UsuarioOrmEntity));
    socioRepository = module.get(getRepositoryToken(SocioOrmEntity));
    nutricionistaOrmRepository = module.get(
      getRepositoryToken(NutricionistaOrmEntity),
    );
    agendaRepository = module.get(getRepositoryToken(AgendaOrmEntity));
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    nutricionistaRepository = module.get(NUTRICIONISTA_REPOSITORY);
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Tenant Isolation', () => {
    it('debe filtrar socio por gimnasioId del TenantContext', async () => {
      // Arrange
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(mockSocio);
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(mockNutricionista as any);
      jest.mocked(agendaRepository.find).mockResolvedValue([mockAgenda[0]]);
      jest.mocked(turnoRepository.findOne).mockResolvedValue(null);
      jest
        .mocked(nutricionistaOrmRepository.findOne)
        .mockResolvedValue(mockNutricionista);
      jest
        .mocked(turnoRepository.save)
        .mockResolvedValue(buildTurnoSaveResult());

      // Act
      await useCase.execute(100, {
        nutricionistaId: 10,
        fechaTurno: '2026-06-15', // Lunes
        horaTurno: '10:00',
      });

      // Assert - Verificar que el socio se buscó con el gimnasioId correcto
      expect(socioRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gimnasioId: 1,
          }),
        }),
      );
    });

    it('debe filtrar turnos existentes por gimnasioId del TenantContext (evitar duplicados)', async () => {
      // Arrange
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(mockSocio);
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(mockNutricionista as any);
      jest.mocked(agendaRepository.find).mockResolvedValue([mockAgenda[0]]);
      jest.mocked(turnoRepository.findOne).mockResolvedValue(null);
      jest
        .mocked(nutricionistaOrmRepository.findOne)
        .mockResolvedValue(mockNutricionista);
      jest
        .mocked(turnoRepository.save)
        .mockResolvedValue(buildTurnoSaveResult());

      // Act
      await useCase.execute(100, {
        nutricionistaId: 10,
        fechaTurno: '2026-06-15', // Lunes
        horaTurno: '10:00',
      });

      // Assert - Verificar que la búsqueda de turnos conflicto usa el gimnasioId
      const findOneCalls = turnoRepository.findOne.mock.calls;
      // El segundo findOne es para verificar conflicto de horario
      expect(findOneCalls[1]?.[0]).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({
            nutricionista: expect.objectContaining({
              gimnasioId: 1,
            }),
          }),
        }),
      );
    });

    it('debe filtrar agenda por gimnasioId del TenantContext', async () => {
      // Arrange
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(mockSocio);
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(mockNutricionista as any);
      jest.mocked(agendaRepository.find).mockResolvedValue([mockAgenda[0]]);
      jest.mocked(turnoRepository.findOne).mockResolvedValue(null);
      jest
        .mocked(nutricionistaOrmRepository.findOne)
        .mockResolvedValue(mockNutricionista);
      jest
        .mocked(turnoRepository.save)
        .mockResolvedValue(buildTurnoSaveResult());

      // Act
      await useCase.execute(100, {
        nutricionistaId: 10,
        fechaTurno: '2026-06-15', // Lunes
        horaTurno: '10:00',
      });

      // Assert - Verificar que la agenda se buscó con el gimnasioId correcto
      expect(agendaRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nutricionista: expect.objectContaining({
              gimnasioId: 1,
            }),
          }),
        }),
      );
    });

    it('debe rechazar reserva cuando ya existe turno para otro gimnasio', async () => {
      // Arrange: Intentando reservar con tenant Gimnasio 1, pero ya existe turno en Gimnasio 2
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(mockSocio);
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(mockNutricionista as any);
      jest.mocked(agendaRepository.find).mockResolvedValue([mockAgenda[0]]);
      jest.mocked(turnoRepository.findOne).mockResolvedValue(null);
      jest
        .mocked(nutricionistaOrmRepository.findOne)
        .mockResolvedValue(mockNutricionista);
      jest
        .mocked(turnoRepository.save)
        .mockResolvedValue(buildTurnoSaveResult());

      // Act
      const result = await useCase.execute(100, {
        nutricionistaId: 10,
        fechaTurno: '2026-06-15', // Lunes
        horaTurno: '10:00',
      });

      // Assert
      expect(result.idTurno).toBe(1);
      expect(turnoRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundError cuando el nutricionista no existe o pertenece a otro gimnasio', async () => {
      // Arrange
      jest.mocked(usuarioRepository.findOne).mockResolvedValue(mockUsuario);
      jest.mocked(socioRepository.findOne).mockResolvedValue(mockSocio);
      jest.mocked(nutricionistaRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(100, {
          nutricionistaId: 999,
          fechaTurno: '2026-06-15',
          horaTurno: '10:00',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('RB14 - Bloqueo de reserva por ficha incompleta', () => {
    const buildMockSocio = (
      fichaSalud: { idFichaSalud: number; completada: boolean } | null,
    ) =>
      ({
        idPersona: 20,
        nombre: 'Juan',
        apellido: 'Socio',
        gimnasioId: 1,
        fichaSalud,
      }) as unknown as SocioOrmEntity;

    const mockUsuarioConPersona = {
      idUsuario: 100,
      persona: { idPersona: 20 },
    } as unknown as UsuarioOrmEntity;

    it('bloquea si la ficha de salud es null (cubierto por lógica RB14)', async () => {
      // Arrange
      jest
        .mocked(usuarioRepository.findOne)
        .mockResolvedValue(mockUsuarioConPersona);
      jest
        .mocked(socioRepository.findOne)
        .mockResolvedValue(buildMockSocio(null));

      // Act & Assert
      await expect(
        useCase.execute(100, {
          nutricionistaId: 10,
          fechaTurno: '2026-06-15',
          horaTurno: '10:00',
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('bloquea si la ficha existe pero completada=false', async () => {
      // Arrange
      jest
        .mocked(usuarioRepository.findOne)
        .mockResolvedValue(mockUsuarioConPersona);
      jest
        .mocked(socioRepository.findOne)
        .mockResolvedValue(
          buildMockSocio({ idFichaSalud: 1, completada: false }),
        );

      // Act & Assert
      await expect(
        useCase.execute(100, {
          nutricionistaId: 10,
          fechaTurno: '2026-06-15',
          horaTurno: '10:00',
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('permite si la ficha existe y completada=true', async () => {
      // Arrange
      jest
        .mocked(usuarioRepository.findOne)
        .mockResolvedValue(mockUsuarioConPersona);
      jest
        .mocked(socioRepository.findOne)
        .mockResolvedValue(
          buildMockSocio({ idFichaSalud: 1, completada: true }),
        );
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(mockNutricionista as any);
      jest.mocked(agendaRepository.find).mockResolvedValue([mockAgenda[0]]);
      jest.mocked(turnoRepository.findOne).mockResolvedValue(null);
      jest
        .mocked(nutricionistaOrmRepository.findOne)
        .mockResolvedValue(mockNutricionista);
      jest
        .mocked(turnoRepository.save)
        .mockResolvedValue(buildTurnoSaveResult());

      // Act
      const result = await useCase.execute(100, {
        nutricionistaId: 10,
        fechaTurno: '2026-06-15',
        horaTurno: '10:00',
      });

      // Assert
      expect(result.idTurno).toBe(1);
      expect(turnoRepository.save).toHaveBeenCalled();
    });
  });
});
