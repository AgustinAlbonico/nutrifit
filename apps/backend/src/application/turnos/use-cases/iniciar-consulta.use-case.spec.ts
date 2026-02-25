import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IniciarConsultaUseCase } from './iniciar-consulta.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

describe('IniciarConsultaUseCase', () => {
  let useCase: IniciarConsultaUseCase;
  let turnoRepository: Repository<TurnoOrmEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IniciarConsultaUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<IniciarConsultaUseCase>(IniciarConsultaUseCase);
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
  });

  it('debe iniciar consulta desde estado PRESENTE', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.PRESENTE,
      consultaIniciadaAt: null,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue({
      ...turno,
      estadoTurno: EstadoTurno.EN_CURSO,
      consultaIniciadaAt: expect.any(Date),
    });

    const result = await useCase.execute(1);

    expect(result.success).toBe(true);
    expect(result.estado).toBe(EstadoTurno.EN_CURSO);
    expect(turnoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoTurno: EstadoTurno.EN_CURSO,
        consultaIniciadaAt: expect.any(Date),
      }),
    );
  });

  it('debe lanzar error si turno no existe', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(999)).rejects.toThrow('Turno no encontrado');
  });

  it('debe lanzar error si turno no está PRESENTE', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.PENDIENTE,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);

    await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede iniciar consulta en un turno con estado PENDIENTE',
    );
  });
});
