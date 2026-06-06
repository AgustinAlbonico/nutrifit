import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbrirFichaDesdeTurnoUseCase } from './abrir-ficha-desde-turno.use-case';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';

describe('AbrirFichaDesdeTurnoUseCase', () => {
  let useCase: AbrirFichaDesdeTurnoUseCase;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let fichaSaludRepository: jest.Mocked<Repository<FichaSaludOrmEntity>>;
  let tenantContext: TenantContextService;

  const mockTurnoConFicha = (
    overrides: Partial<TurnoOrmEntity> = {},
  ): TurnoOrmEntity =>
    ({
      idTurno: 1,
      estadoTurno: 'PRESENTE' as never,
      fechaTurno: new Date('2026-06-10'),
      horaTurno: '10:00',
      socio: {
        idPersona: 50,
        gimnasioId: 1,
        fichaSalud: { idFichaSalud: 7, revisadaPorNutricionistaAt: null },
      } as never,
      nutricionista: { idPersona: 30, gimnasioId: 1 } as never,
      ...overrides,
    }) as TurnoOrmEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbrirFichaDesdeTurnoUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { findOne: jest.fn(), count: jest.fn() },
        },
        {
          provide: getRepositoryToken(FichaSaludOrmEntity),
          useValue: { update: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: {
            gimnasioId: 1,
            rol: Rol.NUTRICIONISTA,
            personaId: 30,
          },
        },
      ],
    }).compile();

    useCase = module.get<AbrirFichaDesdeTurnoUseCase>(AbrirFichaDesdeTurnoUseCase);
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    fichaSaludRepository = module.get(getRepositoryToken(FichaSaludOrmEntity));
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  it('setea revisadaPorNutricionistaAt en la ficha del socio (happy path NUTRICIONISTA con vinculo)', async () => {
    const turno = mockTurnoConFicha();
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest.spyOn(turnoRepository, 'count').mockResolvedValue(2);
    jest
      .spyOn(fichaSaludRepository, 'update')
      .mockResolvedValue({ affected: 1 } as never);

    const before = new Date();
    const result = await useCase.execute({
      turnoId: 1,
      nutricionistaId: 30,
      socioId: 50,
    });
    const after = new Date();

    expect(result.fichaId).toBe(7);
    expect(result.revisada).toBe(true);
    expect(result.revisadaAt).toBeInstanceOf(Date);
    expect(result.revisadaAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.revisadaAt!.getTime()).toBeLessThanOrEqual(after.getTime());

    expect(fichaSaludRepository.update).toHaveBeenCalledWith(
      { idFichaSalud: 7 },
      { revisadaPorNutricionistaAt: result.revisadaAt },
    );
  });

  it('retorna { fichaId: null, revisada: false } si el socio no tiene ficha', async () => {
    const turno = mockTurnoConFicha({
      socio: { idPersona: 50, gimnasioId: 1, fichaSalud: null } as never,
    });
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);

    const result = await useCase.execute({
      turnoId: 1,
      nutricionistaId: 30,
      socioId: 50,
    });

    expect(result.fichaId).toBeNull();
    expect(result.revisada).toBe(false);
    expect(result.revisadaAt).toBeNull();
    expect(fichaSaludRepository.update).not.toHaveBeenCalled();
  });

  it('lanza ForbiddenError si NUTRICIONISTA no tiene turnos previos con el socio (RB13)', async () => {
    const turno = mockTurnoConFicha();
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest.spyOn(turnoRepository, 'count').mockResolvedValue(0);

    await expect(
      useCase.execute({
        turnoId: 1,
        nutricionistaId: 30,
        socioId: 50,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(fichaSaludRepository.update).not.toHaveBeenCalled();
  });

  it('lanza NotFoundError si el turno no pertenece al gimnasio del tenant (RB25)', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    await expect(
      useCase.execute({
        turnoId: 999,
        nutricionistaId: 30,
        socioId: 50,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('ADMIN del mismo gimnasio puede marcar revisada sin validar RB13', async () => {
    Object.defineProperty(tenantContext, 'rol', {
      get: () => Rol.ADMIN,
      configurable: true,
    });
    const turno = mockTurnoConFicha();
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest
      .spyOn(fichaSaludRepository, 'update')
      .mockResolvedValue({ affected: 1 } as never);

    const result = await useCase.execute({
      turnoId: 1,
      nutricionistaId: 30,
      socioId: 50,
    });

    expect(result.revisada).toBe(true);
    expect(turnoRepository.count).not.toHaveBeenCalled();
  });

  it('RECEPCIONISTA del mismo gimnasio puede marcar revisada sin validar RB13', async () => {
    Object.defineProperty(tenantContext, 'rol', {
      get: () => Rol.RECEPCIONISTA,
      configurable: true,
    });
    const turno = mockTurnoConFicha();
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest
      .spyOn(fichaSaludRepository, 'update')
      .mockResolvedValue({ affected: 1 } as never);

    const result = await useCase.execute({
      turnoId: 1,
      nutricionistaId: 30,
      socioId: 50,
    });

    expect(result.revisada).toBe(true);
    expect(turnoRepository.count).not.toHaveBeenCalled();
  });
});
