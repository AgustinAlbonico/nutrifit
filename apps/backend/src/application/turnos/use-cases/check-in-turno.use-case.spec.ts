import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckInTurnoUseCase } from './check-in-turno.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';

describe('CheckInTurnoUseCase (CU-15)', () => {
  let useCase: CheckInTurnoUseCase;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let notificacionesService: jest.Mocked<NotificacionesService>;
  let auditoriaService: jest.Mocked<AuditoriaService>;
  let tenantContext: jest.Mocked<TenantContextService>;

  const fechaHoy = new Date('2026-06-17T03:00:00.000Z'); // 00:00 hora Argentina
  const horaTurno = '15:00';

  const buildMockTurno = (
    overrides: Partial<TurnoOrmEntity> = {},
  ): TurnoOrmEntity =>
    ({
      idTurno: 1,
      estadoTurno: EstadoTurno.CONFIRMADO,
      fechaTurno: fechaHoy,
      horaTurno,
      checkInAt: null,
      llegadaTardeMin: null,
      socio: { idPersona: 20, nombre: 'Juan', apellido: 'Pérez' },
      nutricionista: { idPersona: 10, nombre: 'Dr. Test' },
      ...overrides,
    }) as unknown as TurnoOrmEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInTurnoUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NotificacionesService,
          useValue: {
            crear: jest.fn().mockResolvedValue({ idNotificacion: 1 }),
          },
        },
        {
          provide: AuditoriaService,
          useValue: {
            registrar: jest.fn().mockResolvedValue({ idAuditoria: 1 }),
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            gimnasioId: 1,
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CheckInTurnoUseCase>(CheckInTurnoUseCase);
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    notificacionesService = module.get(NotificacionesService);
    auditoriaService = module.get(AuditoriaService);
    tenantContext = module.get(TenantContextService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Happy path', () => {
    it('cambia el estado de CONFIRMADO a PRESENTE, setea checkInAt, notifica al nutri y audita CHECKIN con antes/despues', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T18:00:00.000Z')); // 15:00 hora Argentina (turno准时)
      const mockTurno = buildMockTurno();
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      turnoRepository.save.mockImplementation(async (t) => t as TurnoOrmEntity);

      const result = await useCase.execute(1);

      expect(result.success).toBe(true);
      expect(result.estado).toBe(EstadoTurno.PRESENTE);
      expect(result.fueIdempotente).toBe(false);
      expect(result.checkInAt).toBeInstanceOf(Date);

      expect(turnoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          idTurno: 1,
          estadoTurno: EstadoTurno.PRESENTE,
          checkInAt: expect.any(Date),
        }),
      );

      // Notifica SOLO al nutricionista (no al socio)
      expect(notificacionesService.crear).toHaveBeenCalledTimes(1);
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          destinatarioId: 10,
          tipo: TipoNotificacion.CHECK_IN,
          titulo: 'Socio realizó check-in',
          metadata: { turnoId: 1 },
        }),
      );

      // Audita CHECKIN con antes/despues
      expect(auditoriaService.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: AccionAuditoria.CHECKIN,
          entidad: 'turno',
          entidadId: 1,
          metadata: expect.objectContaining({
            antes: expect.objectContaining({
              estado: EstadoTurno.CONFIRMADO,
            }),
            despues: expect.objectContaining({
              estado: EstadoTurno.PRESENTE,
              checkInAt: expect.any(String),
            }),
          }),
        }),
      );
    });

    it('setea llegadaTardeMin cuando el check-in es posterior al horario', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T18:20:00.000Z')); // 15:20 hora Argentina (20 min tarde)
      const mockTurno = buildMockTurno();
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      turnoRepository.save.mockImplementation(async (t) => t as TurnoOrmEntity);

      const result = await useCase.execute(1);

      expect(result.estado).toBe(EstadoTurno.PRESENTE);
      expect(turnoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          llegadaTardeMin: 20,
        }),
      );
    });
  });

  describe('A1 — Turno no es del día actual', () => {
    it('rechaza si la fechaTurno es de ayer', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00.000Z'));
      const ayer = new Date('2026-06-16T03:00:00.000Z'); // 00:00 hora Argentina del 16
      const mockTurno = buildMockTurno({ fechaTurno: ayer });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
      await expect(useCase.execute(1)).rejects.toThrow(
        'Solo se puede hacer check-in de turnos del día actual',
      );
      expect(turnoRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('A2 — Estado no permite check-in', () => {
    it('rechaza si el turno está CANCELADO', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00.000Z'));
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.CANCELADO });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
      expect(turnoRepository.save).not.toHaveBeenCalled();
    });

    it('rechaza si el turno está AUSENTE', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00.000Z'));
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.AUSENTE });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
    });

    it('rechaza si el turno está EN_CURSO', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00.000Z'));
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.EN_CURSO });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
    });

    it('rechaza si el turno está REALIZADO', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00.000Z'));
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.REALIZADO });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
    });
  });

  describe('A3 — Idempotencia (doble click)', () => {
    it('si el turno ya está PRESENTE, retorna 200 con fueIdempotente=true, mismo checkInAt, sin guardar y sin auditar', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00.000Z'));
      const checkInAtPrevio = new Date('2026-06-17T14:55:00.000Z');
      const mockTurno = buildMockTurno({
        estadoTurno: EstadoTurno.PRESENTE,
        checkInAt: checkInAtPrevio,
        llegadaTardeMin: null,
      });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      const result = await useCase.execute(1);

      expect(result.success).toBe(true);
      expect(result.estado).toBe(EstadoTurno.PRESENTE);
      expect(result.fueIdempotente).toBe(true);
      expect(result.checkInAt).toEqual(checkInAtPrevio);

      expect(turnoRepository.save).not.toHaveBeenCalled();
      expect(auditoriaService.registrar).not.toHaveBeenCalled();
      expect(notificacionesService.crear).not.toHaveBeenCalled();
    });
  });

  describe('Cálculo de llegada tarde', () => {
    it('permite check-in mucho antes del horario (sin llegadaTardeMin)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T16:00:00.000Z')); // 13:00 ARG (2 horas antes)
      const mockTurno = buildMockTurno();
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      turnoRepository.save.mockImplementation(async (t) => t as TurnoOrmEntity);

      const result = await useCase.execute(1);

      expect(result.success).toBe(true);
      expect(result.estado).toBe(EstadoTurno.PRESENTE);
      expect(result.llegadaTardeMin ?? 0).toBe(0);
      expect(turnoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          llegadaTardeMin: null,
        }),
      );
    });

    it('permite check-in mucho después del horario (calcula llegadaTardeMin)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T20:00:00.000Z')); // 17:00 ARG (2 horas tarde)
      const mockTurno = buildMockTurno();
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      turnoRepository.save.mockImplementation(async (t) => t as TurnoOrmEntity);

      const result = await useCase.execute(1);

      expect(result.success).toBe(true);
      expect(turnoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          llegadaTardeMin: 120, // 2 horas = 120 minutos
        }),
      );
    });
  });

  describe('Errores de dominio', () => {
    it('lanza NotFoundError si el turno no existe o pertenece a otro gimnasio', async () => {
      turnoRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute(999)).rejects.toThrow(NotFoundError);
    });
  });
});
