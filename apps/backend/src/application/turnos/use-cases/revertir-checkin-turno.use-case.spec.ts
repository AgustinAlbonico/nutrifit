import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevertirCheckinTurnoUseCase } from './revertir-checkin-turno.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';

describe('RevertirCheckinTurnoUseCase (CU-15 spec)', () => {
  let useCase: RevertirCheckinTurnoUseCase;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let auditoriaService: jest.Mocked<AuditoriaService>;

  const buildMockTurno = (
    overrides: Partial<TurnoOrmEntity> = {},
  ): TurnoOrmEntity =>
    ({
      idTurno: 1,
      estadoTurno: EstadoTurno.PRESENTE,
      checkInAt: new Date('2026-06-17T15:00:00.000Z'),
      llegadaTardeMin: 0,
      socio: { idPersona: 20 },
      nutricionista: { idPersona: 10 },
      ...overrides,
    }) as unknown as TurnoOrmEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevertirCheckinTurnoUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
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

    useCase = module.get<RevertirCheckinTurnoUseCase>(
      RevertirCheckinTurnoUseCase,
    );
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    auditoriaService = module.get(AuditoriaService);
  });

  describe('Happy path', () => {
    it('revierte PRESENTE → CONFIRMADO, limpia checkInAt y llegadaTardeMin, y registra auditoría REVERT_CHECKIN con motivo', async () => {
      const mockTurno = buildMockTurno();
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      turnoRepository.save.mockImplementation(async (t) => t as TurnoOrmEntity);

      const result = await useCase.execute(
        1,
        'Recepción marcó al socio equivocado',
        999,
      );

      expect(result.success).toBe(true);
      expect(result.estado).toBe(EstadoTurno.CONFIRMADO);

      expect(turnoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          idTurno: 1,
          estadoTurno: EstadoTurno.CONFIRMADO,
          checkInAt: null,
          llegadaTardeMin: null,
        }),
      );

      expect(auditoriaService.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: AccionAuditoria.REVERT_CHECKIN,
          entidad: 'turno',
          entidadId: 1,
          metadata: expect.objectContaining({
            motivo: 'Recepción marcó al socio equivocado',
            antes: expect.objectContaining({
              estado: EstadoTurno.PRESENTE,
              checkInAt: expect.any(String),
              llegadaTardeMin: 0,
            }),
            despues: expect.objectContaining({
              estado: EstadoTurno.CONFIRMADO,
              checkInAt: null,
              llegadaTardeMin: null,
            }),
          }),
          gimnasioId: 1,
        }),
      );
    });
  });

  describe('Errores de estado', () => {
    it('lanza ConflictError si el turno está CONFIRMADO', async () => {
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.CONFIRMADO });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1, 'motivo', 999)).rejects.toThrow(
        ConflictError,
      );
    });

    it('lanza ConflictError si el turno está CANCELADO', async () => {
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.CANCELADO });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1, 'motivo', 999)).rejects.toThrow(
        ConflictError,
      );
    });

    it('lanza ConflictError si el turno está AUSENTE', async () => {
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.AUSENTE });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1, 'motivo', 999)).rejects.toThrow(
        ConflictError,
      );
    });

    it('lanza ConflictError si el turno está EN_CURSO', async () => {
      const mockTurno = buildMockTurno({ estadoTurno: EstadoTurno.EN_CURSO });
      turnoRepository.findOne.mockResolvedValue(mockTurno);

      await expect(useCase.execute(1, 'motivo', 999)).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('Errores de validación', () => {
    it('lanza BadRequestError si el motivo está vacío', async () => {
      await expect(useCase.execute(1, '', 999)).rejects.toThrow(
        BadRequestError,
      );
      await expect(useCase.execute(1, '   ', 999)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('Errores de dominio', () => {
    it('lanza NotFoundError si el turno no existe o pertenece a otro gimnasio', async () => {
      turnoRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute(999, 'motivo', 1)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
