import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { ReabrirConsultaCerradaAutoUseCase } from './reabrir-consulta-cerrada-auto.use-case';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { ForbiddenError } from 'src/domain/exceptions/custom-exceptions';

function buildMockTurno(
  overrides: Partial<TurnoOrmEntity> = {},
): TurnoOrmEntity {
  return {
    idTurno: 1,
    estadoTurno: EstadoTurno.REALIZADO,
    cierreAutomatico: true,
    reabiertaPorCierreAuto: false,
    consultaFinalizadaAt: new Date(),
    nutricionista: { idPersona: 20 } as any,
    socio: { idPersona: 10 } as any,
    ...overrides,
  } as TurnoOrmEntity;
}

describe('ReabrirConsultaCerradaAutoUseCase', () => {
  let useCase: ReabrirConsultaCerradaAutoUseCase;
  let turnoRepo: jest.Mocked<Repository<TurnoOrmEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReabrirConsultaCerradaAutoUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(ReabrirConsultaCerradaAutoUseCase);
    turnoRepo = module.get(getRepositoryToken(TurnoOrmEntity));
  });

  it('debe reabrir un turno REALIZADO con cierreAutomatico=true', async () => {
    const turno = buildMockTurno();
    turnoRepo.findOne.mockResolvedValue(turno);

    const result = await useCase.execute(1, 20);

    expect(turno.estadoTurno).toBe(EstadoTurno.EN_CURSO);
    expect(turno.reabiertaPorCierreAuto).toBe(true);
    expect(turno.cierreAutomatico).toBe(true);
    expect(turno.consultaFinalizadaAt).toBeNull();
    expect(turnoRepo.save).toHaveBeenCalled();
  });

  it('debe lanzar ConflictError si el turno no es REALIZADO', async () => {
    const turno = buildMockTurno({ estadoTurno: EstadoTurno.EN_CURSO });
    turnoRepo.findOne.mockResolvedValue(turno);
    await expect(useCase.execute(1, 20)).rejects.toThrow(ConflictError);
  });

  it('debe lanzar ConflictError si cierreAutomatico es false', async () => {
    const turno = buildMockTurno({ cierreAutomatico: false });
    turnoRepo.findOne.mockResolvedValue(turno);
    await expect(useCase.execute(1, 20)).rejects.toThrow(ConflictError);
  });

  it('debe lanzar ForbiddenError si el nutricionista no es el dueno', async () => {
    const turno = buildMockTurno({ nutricionista: { idPersona: 99 } as any });
    turnoRepo.findOne.mockResolvedValue(turno);
    await expect(useCase.execute(1, 20)).rejects.toThrow(ForbiddenError);
  });

  it('debe lanzar NotFoundError si el turno no existe', async () => {
    turnoRepo.findOne.mockResolvedValue(null);
    await expect(useCase.execute(999, 20)).rejects.toThrow(NotFoundError);
  });
});
