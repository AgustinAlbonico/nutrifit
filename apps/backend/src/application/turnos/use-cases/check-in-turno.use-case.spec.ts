import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckInTurnoUseCase } from './check-in-turno.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

describe('CheckInTurnoUseCase', () => {
  let useCase: CheckInTurnoUseCase;
  let turnoRepository: Repository<TurnoOrmEntity>;

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
      ],
    }).compile();

    useCase = module.get<CheckInTurnoUseCase>(CheckInTurnoUseCase);
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
  });

  it('debe hacer check-in exitoso desde estado PENDIENTE', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.PENDIENTE,
      checkInAt: null,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue({
      ...turno,
      estadoTurno: EstadoTurno.PRESENTE,
      checkInAt: expect.any(Date),
    });

    const result = await useCase.execute(1);

    expect(result.success).toBe(true);
    expect(result.estado).toBe(EstadoTurno.PRESENTE);
    expect(turnoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoTurno: EstadoTurno.PRESENTE,
        checkInAt: expect.any(Date),
      }),
    );
  });

  it('debe hacer check-in exitoso desde estado CONFIRMADO', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.CONFIRMADO,
      checkInAt: null,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue({
      ...turno,
      estadoTurno: EstadoTurno.PRESENTE,
      checkInAt: expect.any(Date),
    });

    const result = await useCase.execute(1);

    expect(result.success).toBe(true);
    expect(result.estado).toBe(EstadoTurno.PRESENTE);
  });

  it('debe lanzar error si turno no existe', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(999)).rejects.toThrow('Turno no encontrado');
  });

  it('debe lanzar error si turno ya está PRESENTE', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.PRESENTE,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);

    await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede hacer check-in en un turno con estado PRESENTE',
    );
  });

  it('debe lanzar error si turno está CANCELADO', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.CANCELADO,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);

    await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
  });
});
