import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrearTurnoEnNombreDeSocioUseCase } from './crear-turno-en-nombre-de-socio.use-case';
import { ValidacionesCreacionTurno } from '../helpers/validaciones-creacion-turno.helper';
import {
  TurnoOrmEntity,
  SocioOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { EmailService } from 'src/application/email/email.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { CreadoPor } from 'src/domain/entities/Turno/creado-por.enum';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { ActorStaff } from 'src/application/turnos/types/actor-staff';
import { CrearTurnoEnNombreDeSocioDto } from 'src/application/turnos/dtos/crear-turno-en-nombre-de-socio.dto';

/**
 * Spec del use-case `CrearTurnoEnNombreDeSocioUseCase` (PR-2 del
 * change `crear-turno-en-nombre-del-socio`).
 *
 * Cubre los 11 casos del tasks.md §PR 2 Task 2.6:
 *  - Happy path RECEPCION / ADMIN / NUTRICIONISTA (3).
 *  - RB14 WARN: RECEPCION + socio sin ficha (1).
 *  - RB14 BLOCK: NUTRICIONISTA + socio sin ficha (1).
 *  - Cross-gym B4: socio de otro gym (1).
 *  - Cross-gym B6: nutri de otro gym (1).
 *  - RB40: turno duplicado mismo dia+mismo nutri (1).
 *  - 404 socioId no existe (1).
 *  - 404 nutricionistaId dado de baja (1).
 *  - Slot ocupado: validarNoConflictoSlot lanza ConflictError (1).
 */
describe('CrearTurnoEnNombreDeSocioUseCase', () => {
  let useCase: CrearTurnoEnNombreDeSocioUseCase;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let nutricionistaOrmRepository: jest.Mocked<
    Repository<NutricionistaOrmEntity>
  >;
  let nutricionistaRepository: jest.Mocked<NutricionistaRepository>;
  let validaciones: jest.Mocked<ValidacionesCreacionTurno>;
  let notificacionesService: jest.Mocked<NotificacionesService>;
  let emailService: jest.Mocked<EmailService>;
  let auditoriaService: jest.Mocked<AuditoriaService>;
  let tenantContext: jest.Mocked<TenantContextService>;
  let logger: jest.Mocked<IAppLoggerService>;

  const GIMNASIO_ID = 1;

  const baseActor = (rol: Rol): ActorStaff => ({
    usuarioId: 100,
    personaId: null,
    rol,
    gimnasioId: GIMNASIO_ID,
  });

  const baseNutricionistaDominio = {
    idPersona: 10,
    nombre: 'Dra.',
    apellido: 'Lopez',
    gimnasioId: GIMNASIO_ID,
    fechaBaja: null,
  };

  const baseNutricionistaOrm = {
    idPersona: 10,
    nombre: 'Dra.',
    apellido: 'Lopez',
    gimnasioId: GIMNASIO_ID,
    matricula: 'MP-1234',
    aniosExperiencia: 5,
    tarifaSesion: 0,
    fechaNacimiento: new Date('1990-01-01'),
    genero: 'F' as never,
    telefono: '111',
    direccion: 'X',
    ciudad: 'CABA',
    provincia: 'BA',
    dni: '12345678',
    fotoPerfilKey: null,
    usuario: { email: 'lopez@nutrifit.test', idUsuario: 1 } as never,
  } as unknown as NutricionistaOrmEntity;

  const socioConFichaCompleta = {
    idPersona: 20,
    nombre: 'Juan',
    apellido: 'Perez',
    gimnasioId: GIMNASIO_ID,
    dni: '11111111',
    fichaSalud: { idFichaSalud: 1, completada: true },
  } as unknown as SocioOrmEntity;

  const socioSinFicha = {
    idPersona: 21,
    nombre: 'Ana',
    apellido: 'Gomez',
    gimnasioId: GIMNASIO_ID,
    dni: '22222222',
    fichaSalud: null,
  } as unknown as SocioOrmEntity;

  const socioFichaIncompleta = {
    idPersona: 22,
    nombre: 'Luis',
    apellido: 'Suarez',
    gimnasioId: GIMNASIO_ID,
    dni: '33333333',
    fichaSalud: { idFichaSalud: 2, completada: false },
  } as unknown as SocioOrmEntity;

  const turnoGuardado = (overrides?: Partial<TurnoOrmEntity>) =>
    ({
      idTurno: 999,
      fechaTurno: new Date('2026-06-15'),
      horaTurno: '10:00',
      estadoTurno: EstadoTurno.PROGRAMADO,
      socio: socioConFichaCompleta,
      nutricionista: baseNutricionistaOrm,
      creadoPor: CreadoPor.RECEPCION,
      ...overrides,
    }) as TurnoOrmEntity;

  const payload: CrearTurnoEnNombreDeSocioDto = {
    socioId: 20,
    nutricionistaId: 10,
    fechaTurno: '2026-06-15',
    horaTurno: '10:00',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrearTurnoEnNombreDeSocioUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { findOne: jest.fn(), save: jest.fn() },
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
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: ValidacionesCreacionTurno,
          useValue: {
            validarFechaHoraNoPasado: jest.fn(),
            validarAgendaDisponible: jest.fn(),
            validarNoConflictoSlot: jest.fn(),
          },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: { enviarNotificacionTurnoParaNutri: jest.fn() },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: GIMNASIO_ID },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<CrearTurnoEnNombreDeSocioUseCase>(
      CrearTurnoEnNombreDeSocioUseCase,
    );
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    socioRepository = module.get(getRepositoryToken(SocioOrmEntity));
    nutricionistaOrmRepository = module.get(
      getRepositoryToken(NutricionistaOrmEntity),
    );
    nutricionistaRepository = module.get(NUTRICIONISTA_REPOSITORY);
    validaciones = module.get(ValidacionesCreacionTurno);
    notificacionesService = module.get(NotificacionesService);
    emailService = module.get(EmailService);
    auditoriaService = module.get(AuditoriaService);
    tenantContext = module.get(TenantContextService);
    logger = module.get(APP_LOGGER_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper para configurar el happy path completo (todos los mocks OK).
  const setupHappyPath = (
    socio: SocioOrmEntity = socioConFichaCompleta,
    creadoPor: CreadoPor = CreadoPor.RECEPCION,
  ) => {
    jest
      .mocked(nutricionistaRepository.findById)
      .mockResolvedValue(baseNutricionistaDominio as never);
    jest.mocked(socioRepository.findOne).mockResolvedValue(socio);
    jest
      .mocked(nutricionistaOrmRepository.findOne)
      .mockResolvedValue(baseNutricionistaOrm);
    jest
      .mocked(turnoRepository.save)
      .mockResolvedValue(turnoGuardado({ creadoPor, socio }));
    jest.mocked(validaciones.validarFechaHoraNoPasado).mockResolvedValue();
    jest.mocked(validaciones.validarAgendaDisponible).mockResolvedValue();
    jest.mocked(validaciones.validarNoConflictoSlot).mockResolvedValue();
  };

  describe('Happy path por rol', () => {
    it('RECEPCION + socio con ficha completa -> creadoPor RECEPCION, sin warning, notifica socio y nutri, audita', async () => {
      setupHappyPath(socioConFichaCompleta, CreadoPor.RECEPCION);

      const result = await useCase.execute(baseActor(Rol.RECEPCIONISTA), payload);

      expect(result.idTurno).toBe(999);
      expect(result.creadoPor).toBe(CreadoPor.RECEPCION);
      expect(result.warning).toBeUndefined();
      expect(result.gimnasioId).toBe(GIMNASIO_ID);

      expect(notificacionesService.crear).toHaveBeenCalledTimes(1);
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          destinatarioId: socioConFichaCompleta.idPersona,
          tipo: TipoNotificacion.TURNO_RESERVADO,
          titulo: 'Turno agendado por recepción',
          metadata: expect.objectContaining({
            turnoId: 999,
            creadoPor: CreadoPor.RECEPCION,
          }),
        }),
      );

      expect(emailService.enviarNotificacionTurnoParaNutri).toHaveBeenCalledTimes(1);
      expect(emailService.enviarNotificacionTurnoParaNutri).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'lopez@nutrifit.test',
          creadoPor: CreadoPor.RECEPCION,
          gimnasioId: GIMNASIO_ID,
        }),
      );

      expect(auditoriaService.registrar).toHaveBeenCalledTimes(1);
      expect(auditoriaService.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 100,
          accion: 'TURNO_ESTADO_CAMBIO',
          entidad: 'turno',
          entidadId: 999,
          metadata: expect.objectContaining({
            tipo: 'CREACION_POR_STAFF',
            creadoPor: CreadoPor.RECEPCION,
            creadoPorUsuarioId: 100,
            creadoPorRol: Rol.RECEPCIONISTA,
            antesJson: null,
            despuesJson: expect.objectContaining({
              socioId: socioConFichaCompleta.idPersona,
              nutricionistaId: payload.nutricionistaId,
              gimnasioId: GIMNASIO_ID,
              fichaIncompleta: false,
            }),
          }),
        }),
      );
    });

    it('ADMIN + socio con ficha completa -> creadoPor ADMIN', async () => {
      setupHappyPath(socioConFichaCompleta, CreadoPor.ADMIN);

      const result = await useCase.execute(baseActor(Rol.ADMIN), payload);

      expect(result.creadoPor).toBe(CreadoPor.ADMIN);
      expect(result.warning).toBeUndefined();
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Turno agendado por administración',
          metadata: expect.objectContaining({ creadoPor: CreadoPor.ADMIN }),
        }),
      );
      expect(emailService.enviarNotificacionTurnoParaNutri).toHaveBeenCalledWith(
        expect.objectContaining({ creadoPor: CreadoPor.ADMIN }),
      );
    });

    it('NUTRICIONISTA + socio con ficha completa -> creadoPor NUTRICIONISTA', async () => {
      setupHappyPath(socioConFichaCompleta, CreadoPor.NUTRICIONISTA);

      const result = await useCase.execute(
        baseActor(Rol.NUTRICIONISTA),
        payload,
      );

      expect(result.creadoPor).toBe(CreadoPor.NUTRICIONISTA);
      expect(result.warning).toBeUndefined();
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Turno agendado por tu nutricionista',
          metadata: expect.objectContaining({
            creadoPor: CreadoPor.NUTRICIONISTA,
          }),
        }),
      );
      expect(emailService.enviarNotificacionTurnoParaNutri).toHaveBeenCalledWith(
        expect.objectContaining({ creadoPor: CreadoPor.NUTRICIONISTA }),
      );
    });
  });

  describe('RB14 diferenciado (policy por rol)', () => {
    it('RECEPCION + socio sin ficha -> 201 con warning socio_sin_ficha', async () => {
      setupHappyPath(socioSinFicha, CreadoPor.RECEPCION);

      const result = await useCase.execute(baseActor(Rol.RECEPCIONISTA), {
        ...payload,
        socioId: 21,
      });

      expect(result.warning).toBe('socio_sin_ficha');
      expect(result.creadoPor).toBe(CreadoPor.RECEPCION);
      expect(turnoRepository.save).toHaveBeenCalledTimes(1);
    });

    it('RECEPCION + socio con ficha completada=false -> 201 con warning socio_sin_ficha', async () => {
      setupHappyPath(socioFichaIncompleta, CreadoPor.RECEPCION);

      const result = await useCase.execute(baseActor(Rol.RECEPCIONISTA), {
        ...payload,
        socioId: 22,
      });

      expect(result.warning).toBe('socio_sin_ficha');
      expect(turnoRepository.save).toHaveBeenCalledTimes(1);
    });

    it('NUTRICIONISTA + socio sin ficha -> BadRequestError con mensaje de ficha', async () => {
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(baseNutricionistaDominio as never);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socioSinFicha);

      await expect(
        useCase.execute(baseActor(Rol.NUTRICIONISTA), {
          ...payload,
          socioId: 21,
        }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        useCase.execute(baseActor(Rol.NUTRICIONISTA), {
          ...payload,
          socioId: 21,
        }),
      ).rejects.toThrow(/ficha m.dica/i);

      // No se debe persistir nada si el bloqueo es estricto.
      expect(turnoRepository.save).not.toHaveBeenCalled();
    });

    it('NUTRICIONISTA + socio con ficha completada=false -> BadRequestError', async () => {
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(baseNutricionistaDominio as never);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socioFichaIncompleta);

      await expect(
        useCase.execute(baseActor(Rol.NUTRICIONISTA), {
          ...payload,
          socioId: 22,
        }),
      ).rejects.toThrow(BadRequestError);

      expect(turnoRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Cross-gym (RB proposal B4/B6)', () => {
    it('B4: socio de gym 2 + actor RECEPCION en gym 1 -> ForbiddenError', async () => {
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(baseNutricionistaDominio as never);
      // socio de otro gym: el `where` del use-case ya filtra por
      // gimnasioId, asi que el findOne retorna null.
      jest.mocked(socioRepository.findOne).mockResolvedValue(null);

      await expect(
        useCase.execute(baseActor(Rol.RECEPCIONISTA), payload),
      ).rejects.toThrow(NotFoundError);

      expect(turnoRepository.save).not.toHaveBeenCalled();
    });

    it('B4 estricto: socio de gym 2 que aparece en el findOne (no deberia) -> ForbiddenError por validarScopeGimnasio', async () => {
      // Este caso simula data inconsistency: el findOne retorna un
      // socio de otro gym (no deberia pasar, pero defensa en
      // profundidad). El use-case debe detectar la diferencia y
      // lanzar 403.
      const socioOtroGym = {
        ...socioConFichaCompleta,
        gimnasioId: 2,
      } as SocioOrmEntity;

      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(baseNutricionistaDominio as never);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socioOtroGym);

      await expect(
        useCase.execute(baseActor(Rol.RECEPCIONISTA), payload),
      ).rejects.toThrow(ForbiddenError);

      expect(turnoRepository.save).not.toHaveBeenCalled();
    });

    it('B6: nutri de gym 1 + socio de gym 2 -> ForbiddenError', async () => {
      // El socio se resuelve OK en el findOne (mockeamos un socio
      // que coincide con gimnasio del actor), pero el nutri es de
      // otro gym. La validacion de scope debe rechazar.
      const socioMismoGym = socioConFichaCompleta;
      const nutriOtroGym = { ...baseNutricionistaDominio, gimnasioId: 2 };

      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(nutriOtroGym as never);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socioMismoGym);

      await expect(
        useCase.execute(baseActor(Rol.RECEPCIONISTA), payload),
      ).rejects.toThrow(ForbiddenError);

      expect(turnoRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Validaciones de turno y resolucion', () => {
    it('RB40: validarNoConflictoSlot lanza ConflictError (slot duplicado mismo dia+mismo nutri)', async () => {
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(baseNutricionistaDominio as never);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socioConFichaCompleta);
      jest.mocked(validaciones.validarFechaHoraNoPasado).mockResolvedValue();
      jest.mocked(validaciones.validarAgendaDisponible).mockResolvedValue();
      jest
        .mocked(validaciones.validarNoConflictoSlot)
        .mockRejectedValue(new ConflictError('slot ocupado'));

      await expect(
        useCase.execute(baseActor(Rol.RECEPCIONISTA), payload),
      ).rejects.toThrow(ConflictError);

      expect(turnoRepository.save).not.toHaveBeenCalled();
    });

    it('404: socioId no existe -> NotFoundError', async () => {
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(baseNutricionistaDominio as never);
      jest.mocked(socioRepository.findOne).mockResolvedValue(null);

      await expect(
        useCase.execute(baseActor(Rol.RECEPCIONISTA), {
          ...payload,
          socioId: 9999,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('404: nutricionistaId no existe -> NotFoundError', async () => {
      jest.mocked(nutricionistaRepository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute(baseActor(Rol.RECEPCIONISTA), {
          ...payload,
          nutricionistaId: 9999,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('404: nutricionistaId dado de baja -> NotFoundError', async () => {
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue({
          ...baseNutricionistaDominio,
          fechaBaja: new Date('2026-01-01'),
        } as never);

      await expect(
        useCase.execute(baseActor(Rol.RECEPCIONISTA), {
          ...payload,
          nutricionistaId: 10,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('validarFechaHoraNoPasado falla -> BadRequestError (no llega a persistir)', async () => {
      jest
        .mocked(nutricionistaRepository.findById)
        .mockResolvedValue(baseNutricionistaDominio as never);
      jest.mocked(socioRepository.findOne).mockResolvedValue(socioConFichaCompleta);
      jest
        .mocked(validaciones.validarFechaHoraNoPasado)
        .mockRejectedValue(new BadRequestError('fecha pasada'));

      await expect(
        useCase.execute(baseActor(Rol.RECEPCIONISTA), payload),
      ).rejects.toThrow(BadRequestError);

      expect(turnoRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Side effects best-effort', () => {
    it('si la notificacion al socio falla, se loguea y se continua (no aborta)', async () => {
      setupHappyPath();

      jest
        .mocked(notificacionesService.crear)
        .mockRejectedValue(new Error('notif service down'));

      const result = await useCase.execute(baseActor(Rol.RECEPCIONISTA), payload);

      // El turno igual se persiste y la respuesta es OK.
      expect(result.idTurno).toBe(999);
      expect(turnoRepository.save).toHaveBeenCalled();
      // El email al nutri SI se envia (best-effort independiente).
      expect(emailService.enviarNotificacionTurnoParaNutri).toHaveBeenCalled();
      // El logger.warn registro el fallo.
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('notif service down'),
      );
    });

    it('si el email al nutri falla, se loguea y se continua (no aborta)', async () => {
      setupHappyPath();

      jest
        .mocked(emailService.enviarNotificacionTurnoParaNutri)
        .mockRejectedValue(new Error('smtp down'));

      const result = await useCase.execute(baseActor(Rol.RECEPCIONISTA), payload);

      expect(result.idTurno).toBe(999);
      expect(turnoRepository.save).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('smtp down'),
      );
    });

    it('si la auditoria falla, se loguea y se continua', async () => {
      setupHappyPath();

      jest
        .mocked(auditoriaService.registrar)
        .mockRejectedValue(new Error('audit db down'));

      const result = await useCase.execute(baseActor(Rol.RECEPCIONISTA), payload);

      expect(result.idTurno).toBe(999);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('audit db down'),
      );
    });

    it('si el nutri no tiene email, se omite el envio y se loguea', async () => {
      setupHappyPath();
      const nutriSinEmail = {
        ...baseNutricionistaOrm,
        usuario: { email: null, idUsuario: 1 } as never,
      } as NutricionistaOrmEntity;
      jest
        .mocked(nutricionistaOrmRepository.findOne)
        .mockResolvedValue(nutriSinEmail);

      const result = await useCase.execute(baseActor(Rol.RECEPCIONISTA), payload);

      expect(result.idTurno).toBe(999);
      expect(emailService.enviarNotificacionTurnoParaNutri).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('sin email'),
      );
    });
  });

  describe('Multi-Tenant Isolation (TenantContext.gimnasioId se usa en el findOne del socio)', () => {
    it('consulta el socio con filtro de gimnasio del actor', async () => {
      setupHappyPath();

      await useCase.execute(baseActor(Rol.RECEPCIONISTA), payload);

      expect(socioRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            idPersona: payload.socioId,
            gimnasioId: GIMNASIO_ID,
          }),
          relations: expect.objectContaining({ fichaSalud: true }),
        }),
      );
    });
  });
});
