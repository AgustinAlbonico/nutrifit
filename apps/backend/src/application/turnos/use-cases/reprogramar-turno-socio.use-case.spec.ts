import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReprogramarTurnoSocioUseCase } from './reprogramar-turno-socio.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { AgendaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/agenda.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { ReprogramarTurnoSocioDto } from 'src/application/turnos/dtos';
import {
  POLITICA_OPERATIVA_REPOSITORY,
  IPoliticaOperativaRepository,
} from 'src/application/politicas/politica-operativa.repository';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

describe('ReprogramarTurnoSocioUseCase', () => {
  let useCase: ReprogramarTurnoSocioUseCase;
  let usuarioRepository: jest.Mocked<Repository<UsuarioOrmEntity>>;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let agendaRepository: jest.Mocked<Repository<AgendaOrmEntity>>;
  let politicaRepository: jest.Mocked<IPoliticaOperativaRepository>;
  let logger: jest.Mocked<IAppLoggerService>;
  let auditoriaService: jest.Mocked<AuditoriaService>;

  const mockNutricionista = {
    idPersona: 10,
    nombre: 'Dr. Test',
    apellido: 'Nutricionista',
  } as SocioOrmEntity;

  const mockSocio = {
    idPersona: 20,
    nombre: 'Juan',
    apellido: 'Socio',
  } as SocioOrmEntity;

  const mockUsuario = {
    idUsuario: 100,
    persona: mockSocio,
  } as unknown as UsuarioOrmEntity;

  const buildMockTurno = (
    overrides?: Partial<TurnoOrmEntity>,
  ): TurnoOrmEntity =>
    ({
      idTurno: 1,
      fechaTurno: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      horaTurno: '10:00',
      estadoTurno: EstadoTurno.PROGRAMADO,
      checkInAt: null,
      consultaIniciadaAt: null,
      consultaFinalizadaAt: null,
      ausenteAt: null,
      motivoCancelacion: null,
      fechaOriginal: null,
      socio: mockSocio,
      nutricionista: mockNutricionista,
      gimnasio: null,
      ...overrides,
    }) as TurnoOrmEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReprogramarTurnoSocioUseCase,
        {
          provide: getRepositoryToken(UsuarioOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgendaOrmEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: POLITICA_OPERATIVA_REPOSITORY,
          useValue: {
            getPlazoReprogramacion: jest.fn(),
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn() },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<ReprogramarTurnoSocioUseCase>(
      ReprogramarTurnoSocioUseCase,
    );
    usuarioRepository = module.get(getRepositoryToken(UsuarioOrmEntity));
    socioRepository = module.get(getRepositoryToken(SocioOrmEntity));
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    agendaRepository = module.get(getRepositoryToken(AgendaOrmEntity));
    politicaRepository = module.get(POLITICA_OPERATIVA_REPOSITORY);
    logger = module.get(APP_LOGGER_SERVICE);
    auditoriaService = module.get(AuditoriaService);
  });

  describe('execute', () => {
    it('debe guardar la fecha original antes de reprogramar', async () => {
      // Arrange
      // May 15, 2026 is a Friday (dia=5 in getArgentinaWeekdayIndex: 0=Dom,1=Lun,...,5=Vie)
      const fechaOriginal = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const mockTurno = buildMockTurno({ fechaTurno: fechaOriginal });
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoReprogramacion.mockResolvedValue(24);
      // May 15 is Friday (dia=5), agenda must include dia=5
      agendaRepository.find.mockResolvedValue([
        {
          dia: 5, // VIERNES
          horaInicio: '09:00',
          horaFin: '17:00',
          duracionTurno: 60,
        } as unknown as AgendaOrmEntity,
      ]);
      // First findOne returns the mockTurno (for initial lookup)
      // Second findOne returns null (no conflicting turno found)
      turnoRepository.findOne
        .mockResolvedValueOnce(mockTurno)
        .mockResolvedValueOnce(null);
      turnoRepository.save.mockImplementation(async (turno) => {
        return turno as TurnoOrmEntity;
      });

      const payload: ReprogramarTurnoSocioDto = {
        fechaTurno: '2026-05-15',
        horaTurno: '11:00',
      };

      // Act
      const result = await useCase.execute(100, 1, payload);

      // Assert
      expect(result.fechaOriginal).toBeDefined();
      // The saved turno should have fechaOriginal set
      const savedTurno = turnoRepository.save.mock
        .calls[0][0] as TurnoOrmEntity;
      expect(savedTurno.fechaOriginal).toEqual(fechaOriginal);
      // El estado se mantiene como PROGRAMADO tras reprogramar
      expect(savedTurno.estadoTurno).toBe(EstadoTurno.PROGRAMADO);
    });

    it('debe lanzar NotFoundError cuando el turno no existe', async () => {
      // Arrange
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(null);

      const payload: ReprogramarTurnoSocioDto = {
        fechaTurno: '2026-05-15',
        horaTurno: '11:00',
      };

      // Act & Assert
      await expect(useCase.execute(100, 999, payload)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('debe lanzar ForbiddenError cuando el socio no es el dueño del turno', async () => {
      // Arrange: usuario->socio (idPersona=20) intenta reprogramar turno de otro socio (idPersona=999)
      usuarioRepository.findOne.mockResolvedValue({
        ...mockUsuario,
        persona: mockSocio, // usuario tiene mockSocio con idPersona=20
      } as UsuarioOrmEntity);
      socioRepository.findOne.mockResolvedValue(mockSocio); // socioResolved = mockSocio (idPersona=20)
      const otroSocio = { ...mockSocio, idPersona: 999 } as SocioOrmEntity;
      const mockTurno = buildMockTurno({ socio: otroSocio }); // turno pertenece a otroSocio (idPersona=999)
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      agendaRepository.find.mockResolvedValue([
        {
          dia: 5,
          horaInicio: '09:00',
          horaFin: '17:00',
          duracionTurno: 60,
        } as unknown as AgendaOrmEntity,
      ]);

      const payload: ReprogramarTurnoSocioDto = {
        fechaTurno: '2026-05-15',
        horaTurno: '11:00',
      };

      // Act & Assert: socio con idPersona=20 no puede reprogramar turno de socio con idPersona=999
      await expect(useCase.execute(100, 1, payload)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('debe lanzar BadRequestError cuando el turno no esta en estado PROGRAMADO', async () => {
      // Arrange
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.PRESENTE });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      const payload: ReprogramarTurnoSocioDto = {
        fechaTurno: '2026-05-15',
        horaTurno: '11:00',
      };

      // Act & Assert
      await expect(useCase.execute(100, 1, payload)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('debe usar el plazo de reprogramacion de la politica del gimnasio', async () => {
      // Arrange
      const mockTurno = buildMockTurno();
      mockTurno.gimnasio = { idGimnasio: 5 } as any;
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoReprogramacion.mockResolvedValue(24); // policy says 24 hours
      // May 15 is Friday (dia=5)
      agendaRepository.find.mockResolvedValue([
        {
          dia: 5,
          horaInicio: '09:00',
          horaFin: '17:00',
          duracionTurno: 60,
        } as unknown as AgendaOrmEntity,
      ]);
      // First findOne returns the mockTurno (for initial lookup)
      // Second findOne returns null (no conflicting turno found)
      turnoRepository.findOne
        .mockResolvedValueOnce(mockTurno)
        .mockResolvedValueOnce(null);
      turnoRepository.save.mockImplementation(
        async (turno) => turno as TurnoOrmEntity,
      );

      const payload: ReprogramarTurnoSocioDto = {
        fechaTurno: '2026-05-15',
        horaTurno: '11:00',
      };

      // Act
      await useCase.execute(100, 1, payload);

      // Assert
      expect(politicaRepository.getPlazoReprogramacion).toHaveBeenCalledWith(5);
    });

    it('debe rechazar reprogramacion si faltan menos horas de las indicadas por la politica', async () => {
      // Arrange
      const mockTurno = buildMockTurno({
        fechaTurno: new Date(Date.now() + 12 * 60 * 60 * 1000), // only 12 hours from now
      });
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoReprogramacion.mockResolvedValue(24); // policy requires 24 hours

      const payload: ReprogramarTurnoSocioDto = {
        fechaTurno: '2026-05-15',
        horaTurno: '11:00',
      };

      // Act & Assert
      await expect(useCase.execute(100, 1, payload)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('debe usar gimnasioId 1 por defecto cuando el turno no tiene gimnasio asignado', async () => {
      // Arrange
      const mockTurno = buildMockTurno({ gimnasio: undefined as any });
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoReprogramacion.mockResolvedValue(24);
      agendaRepository.find.mockResolvedValue([
        {
          dia: 5,
          horaInicio: '09:00',
          horaFin: '17:00',
          duracionTurno: 60,
        } as unknown as AgendaOrmEntity,
      ]);
      // First findOne returns the mockTurno (for initial lookup)
      // Second findOne returns null (no conflicting turno found)
      turnoRepository.findOne
        .mockResolvedValueOnce(mockTurno)
        .mockResolvedValueOnce(null);
      turnoRepository.save.mockImplementation(
        async (turno) => turno as TurnoOrmEntity,
      );

      const payload: ReprogramarTurnoSocioDto = {
        fechaTurno: '2026-05-15',
        horaTurno: '11:00',
      };

      // Act
      await useCase.execute(100, 1, payload);

      // Assert
      expect(politicaRepository.getPlazoReprogramacion).toHaveBeenCalledWith(1);
    });

    it('debe registrar auditoria al reprogramar', async () => {
      // Arrange
      const mockTurno = buildMockTurno();
      mockTurno.gimnasio = { idGimnasio: 1 } as any;
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoReprogramacion.mockResolvedValue(24);
      agendaRepository.find.mockResolvedValue([
        {
          dia: 5,
          horaInicio: '09:00',
          horaFin: '17:00',
          duracionTurno: 60,
        } as unknown as AgendaOrmEntity,
      ]);
      turnoRepository.findOne
        .mockResolvedValueOnce(mockTurno)
        .mockResolvedValueOnce(null);
      turnoRepository.save.mockImplementation(
        async (turno) => turno as TurnoOrmEntity,
      );

      const payload: ReprogramarTurnoSocioDto = {
        fechaTurno: '2026-05-15',
        horaTurno: '11:00',
        motivo: 'Cambio de horario laboral',
      };

      // Act
      await useCase.execute(100, 1, payload);

      // Assert
      expect(auditoriaService.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'TURNO_ESTADO_CAMBIO',
          entidad: 'Turno',
          metadata: expect.objectContaining({
            tipo: 'REPROGRAMACION',
            motivo: 'Cambio de horario laboral',
          }),
        }),
      );
    });
  });
});
