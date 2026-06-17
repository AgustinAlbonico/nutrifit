import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarcarAusenteManualUseCase } from './marcar-ausente-manual.use-case';
import { MarcarAusenteManualDto } from '../dtos/marcar-ausente-manual.dto';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

describe('MarcarAusenteManualUseCase', () => {
  let useCase: MarcarAusenteManualUseCase;
  let turnoRepository: Repository<TurnoOrmEntity>;
  let auditoriaService: AuditoriaService;
  let notificacionesService: NotificacionesService;
  let tenantContext: TenantContextService;

  const mockTurno = (overrides: Partial<TurnoOrmEntity> = {}): TurnoOrmEntity =>
    ({
      idTurno: 1,
      estadoTurno: EstadoTurno.PRESENTE,
      fechaTurno: new Date('2026-06-10'),
      horaTurno: '10:00',
      ausenteAt: null,
      ausenteMotivo: null,
      nutricionista: { idPersona: 30, gimnasioId: 1 } as never,
      socio: { idPersona: 50, gimnasioId: 1 } as never,
      ...overrides,
    }) as TurnoOrmEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcarAusenteManualUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: TenantContextService,
          useValue: buildTenantContext({
            gimnasioId: 1,
            personaId: 30,
            rol: Rol.NUTRICIONISTA,
          }),
        },
      ],
    }).compile();

    useCase = module.get<MarcarAusenteManualUseCase>(
      MarcarAusenteManualUseCase,
    );
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
    auditoriaService = module.get<AuditoriaService>(AuditoriaService);
    notificacionesService = module.get<NotificacionesService>(
      NotificacionesService,
    );
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  it('marca PRESENTE como AUSENTE con auditoria y notificacion (happy path)', async () => {
    const turno = mockTurno({ estadoTurno: EstadoTurno.PRESENTE });
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue(turno);

    const dto: MarcarAusenteManualDto = { motivo: 'No se presento' };

    const result = await useCase.execute(1, dto);

    expect(result.estadoTurno).toBe(EstadoTurno.AUSENTE);
    expect(turno.estadoTurno).toBe(EstadoTurno.AUSENTE);
    expect(turno.ausenteAt).toBeInstanceOf(Date);
    expect(turno.ausenteMotivo).toBe('No se presento');
    expect(auditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'MANUAL_ABSENT', entidad: 'Turno' }),
    );
    expect(notificacionesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'TURNO_AUSENTE', destinatarioId: 50 }),
    );
  });

  it('rechaza turno en estado REALIZADO con ConflictError', async () => {
    const turno = mockTurno({ estadoTurno: EstadoTurno.REALIZADO });
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);

    await expect(useCase.execute(1, { motivo: 'X' })).rejects.toThrow(
      ConflictError,
    );
    expect(turnoRepository.save).not.toHaveBeenCalled();
  });

  it('lanza NotFoundError si el turno es de otro gimnasio (RB25)', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute(99, { motivo: 'X' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('RECEPCIONISTA cross-gym no encuentra el turno (NotFoundError)', async () => {
    (tenantContext as { gimnasioId: number }).gimnasioId = 1;
    Object.defineProperty(tenantContext, 'rol', {
      get: () => Rol.RECEPCIONISTA,
      configurable: true,
    });
    Object.defineProperty(tenantContext, 'personaId', {
      get: () => null,
      configurable: true,
    });
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute(99, { motivo: 'X' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('ADMIN del mismo gym puede marcar ausente aunque no sea dueno del turno', async () => {
    Object.defineProperty(tenantContext, 'rol', {
      get: () => Rol.ADMIN,
      configurable: true,
    });
    Object.defineProperty(tenantContext, 'personaId', {
      get: () => 99,
      configurable: true,
    });
    const turno = mockTurno({
      estadoTurno: EstadoTurno.CONFIRMADO,
      nutricionista: { idPersona: 30, gimnasioId: 1 } as never,
    });
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue(turno);

    const result = await useCase.execute(1, { motivo: 'Cancelo por admin' });

    expect(result.estadoTurno).toBe(EstadoTurno.AUSENTE);
    expect(auditoriaService.registrar).toHaveBeenCalled();
  });

  it('lanza ForbiddenError si el nutricionista no es dueno y no es RECEPCIONISTA/ADMIN', async () => {
    const turno = mockTurno({
      nutricionista: { idPersona: 30, gimnasioId: 1 } as never,
    });
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    Object.defineProperty(tenantContext, 'personaId', {
      get: () => 99,
      configurable: true,
    });
    Object.defineProperty(tenantContext, 'rol', {
      get: () => 'SOCIO' as Rol,
      configurable: true,
    });

    await expect(useCase.execute(1, { motivo: 'X' })).rejects.toThrow(
      ForbiddenError,
    );
  });
});

function buildTenantContext(values: {
  gimnasioId: number;
  personaId: number | null;
  rol: Rol | null;
}): TenantContextService {
  const ctx: Record<string, unknown> = {
    gimnasioId: values.gimnasioId,
    personaId: values.personaId,
    rol: values.rol,
  };
  return ctx as unknown as TenantContextService;
}
