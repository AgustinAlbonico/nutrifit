import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CancelarTurnoSocioUseCase } from './cancelar-turno-socio.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  POLITICA_OPERATIVA_REPOSITORY,
  IPoliticaOperativaRepository,
} from 'src/application/politicas/politica-operativa.repository';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { TurnoConfirmacionTokenOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno-confirmacion-token.entity';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

describe('CancelarTurnoSocioUseCase', () => {
  let useCase: CancelarTurnoSocioUseCase;
  let usuarioRepository: jest.Mocked<Repository<UsuarioOrmEntity>>;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let politicaRepository: jest.Mocked<IPoliticaOperativaRepository>;
  let logger: jest.Mocked<IAppLoggerService>;

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
        CancelarTurnoSocioUseCase,
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
          provide: getRepositoryToken(TurnoConfirmacionTokenOrmEntity),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn() },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn() },
        },
        {
          provide: POLITICA_OPERATIVA_REPOSITORY,
          useValue: {
            getPlazoCancelacion: jest.fn(),
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CancelarTurnoSocioUseCase>(CancelarTurnoSocioUseCase);
    usuarioRepository = module.get(getRepositoryToken(UsuarioOrmEntity));
    socioRepository = module.get(getRepositoryToken(SocioOrmEntity));
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    politicaRepository = module.get(POLITICA_OPERATIVA_REPOSITORY);
    logger = module.get(APP_LOGGER_SERVICE);
  });

  describe('execute', () => {
    it('debe cancelar turno cuando el socio es el dueño y el plazo de cancelacion lo permite', async () => {
      // Arrange
      const mockTurno = buildMockTurno();
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoCancelacion.mockResolvedValue(24);
      turnoRepository.save.mockResolvedValue({
        ...mockTurno,
        estadoTurno: EstadoTurno.CANCELADO,
        motivoCancelacion: 'Cancelado por socio',
      });

      // Act
      const result = await useCase.execute(100, 1);

      // Assert
      expect(result.estadoTurno).toBe(EstadoTurno.CANCELADO);
      expect(result.motivoCancelacion).toBe('Cancelado por socio');
      expect(politicaRepository.getPlazoCancelacion).toHaveBeenCalledWith(1); // default gimnasioId
      expect(turnoRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundError cuando el turno no existe', async () => {
      // Arrange
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(100, 999)).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar ForbiddenError cuando el socio no es el dueño del turno', async () => {
      // Arrange: usuario->socio (idPersona=20) intenta cancelar turno de otro socio (idPersona=999)
      usuarioRepository.findOne.mockResolvedValue({
        ...mockUsuario,
        persona: mockSocio, // usuario tiene mockSocio con idPersona=20
      } as UsuarioOrmEntity);
      socioRepository.findOne.mockResolvedValue(mockSocio); // socioResolved = mockSocio (idPersona=20)
      const otroSocio = { ...mockSocio, idPersona: 999 } as SocioOrmEntity;
      const mockTurno = buildMockTurno({ socio: otroSocio }); // turno pertenece a otroSocio (idPersona=999)
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      // Act & Assert: socio con idPersona=20 no puede cancelar turno de socio con idPersona=999
      await expect(useCase.execute(100, 1)).rejects.toThrow(ForbiddenError);
    });

    it('debe lanzar BadRequestError cuando el turno no esta en estado PROGRAMADO', async () => {
      // Arrange
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.PRESENTE });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      // Act & Assert
      await expect(useCase.execute(100, 1)).rejects.toThrow(BadRequestError);
    });

    it('debe usar el plazo de cancelacion de la politica del gimnasio', async () => {
      // Arrange
      const mockTurno = buildMockTurno();
      mockTurno.gimnasio = { idGimnasio: 5 } as any;
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoCancelacion.mockResolvedValue(24); // policy says 24 hours
      turnoRepository.save.mockResolvedValue({
        ...mockTurno,
        estadoTurno: EstadoTurno.CANCELADO,
        motivoCancelacion: 'Cancelado por socio',
      });

      // Act
      await useCase.execute(100, 1);

      // Assert
      expect(politicaRepository.getPlazoCancelacion).toHaveBeenCalledWith(5);
    });

    it('debe rechazar cancelacion si faltan menos horas de las indicadas por la politica', async () => {
      // Arrange
      const mockTurno = buildMockTurno({
        fechaTurno: new Date(Date.now() + 12 * 60 * 60 * 1000), // only 12 hours from now
      });
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoCancelacion.mockResolvedValue(24); // policy requires 24 hours

      // Act & Assert
      await expect(useCase.execute(100, 1)).rejects.toThrow(BadRequestError);
    });

    it('debe persistir el motivo de cancelacion en el turno', async () => {
      // Arrange
      const mockTurno = buildMockTurno();
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoCancelacion.mockResolvedValue(24);

      let savedTurno: TurnoOrmEntity | null = null;
      turnoRepository.save.mockImplementation(async (turno) => {
        savedTurno = turno as TurnoOrmEntity;
        return {
          ...turno,
          estadoTurno: EstadoTurno.CANCELADO,
        } as TurnoOrmEntity;
      });

      // Act
      await useCase.execute(100, 1);

      // Assert
      expect(savedTurno).not.toBeNull();
      expect(savedTurno!.motivoCancelacion).toBe('Cancelado por socio');
      expect(savedTurno!.estadoTurno).toBe(EstadoTurno.CANCELADO);
    });

    it('debe usar el motivo del DTO cuando se proporciona', async () => {
      // Arrange
      const mockTurno = buildMockTurno();
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoCancelacion.mockResolvedValue(24);

      let savedTurno: TurnoOrmEntity | null = null;
      turnoRepository.save.mockImplementation(async (turno) => {
        savedTurno = turno as TurnoOrmEntity;
        return {
          ...turno,
          estadoTurno: EstadoTurno.CANCELADO,
        } as TurnoOrmEntity;
      });

      // Act
      await useCase.execute(100, 1, undefined, { motivo: 'Cambio de planes' });

      // Assert
      expect(savedTurno).not.toBeNull();
      expect(savedTurno!.motivoCancelacion).toBe('Cambio de planes');
    });

    it('debe usar gimnasioId 1 por defecto cuando el turno no tiene gimnasio asignado', async () => {
      // Arrange
      const mockTurno = buildMockTurno({ gimnasio: undefined as any });
      usuarioRepository.findOne.mockResolvedValue(mockUsuario);
      socioRepository.findOne.mockResolvedValue(mockSocio);
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      politicaRepository.getPlazoCancelacion.mockResolvedValue(24);
      turnoRepository.save.mockResolvedValue({
        ...mockTurno,
        estadoTurno: EstadoTurno.CANCELADO,
        motivoCancelacion: 'Cancelado por socio',
      });

      // Act
      await useCase.execute(100, 1);

      // Assert
      expect(politicaRepository.getPlazoCancelacion).toHaveBeenCalledWith(1);
    });
  });
});
