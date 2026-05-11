import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AusenciaTurnoScheduler } from './ausencia-turno.scheduler';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  POLITICA_OPERATIVA_REPOSITORY,
  IPoliticaOperativaRepository,
} from 'src/application/politicas/politica-operativa.repository';

describe('AusenciaTurnoScheduler', () => {
  let scheduler: AusenciaTurnoScheduler;
  let turnoRepository: Repository<TurnoOrmEntity>;
  let politicaRepository: IPoliticaOperativaRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AusenciaTurnoScheduler,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: POLITICA_OPERATIVA_REPOSITORY,
          useValue: {
            getUmbralAusente: jest.fn().mockResolvedValue(30),
          },
        },
      ],
    }).compile();

    scheduler = module.get<AusenciaTurnoScheduler>(AusenciaTurnoScheduler);
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
    politicaRepository = module.get<IPoliticaOperativaRepository>(
      POLITICA_OPERATIVA_REPOSITORY,
    );
  });

  it('debe marcar turnos como AUSENTE después del umbral', async () => {
    const ahora = new Date();
    ahora.setHours(14, 0, 0, 0);

    const fechaHoyStr = ahora.toISOString().split('T')[0];

    const turnoAtrasado = {
      idTurno: 1,
      fechaTurno: new Date(fechaHoyStr + 'T13:00:00.000Z'),
      horaTurno: '13:00',
      estadoTurno: EstadoTurno.PROGRAMADO,
      ausenteAt: null,
      gimnasio: { idGimnasio: 1 },
    } as TurnoOrmEntity;

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoAtrasado]),
    };

    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);

    jest.useFakeTimers();
    jest.setSystemTime(ahora);

    jest.spyOn(turnoRepository, 'save').mockResolvedValue({
      ...turnoAtrasado,
      estadoTurno: EstadoTurno.AUSENTE,
    } as TurnoOrmEntity);

    await scheduler.marcarAusentesAutomaticos();

    expect(politicaRepository.getUmbralAusente).toHaveBeenCalledWith(1);
    expect(turnoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoTurno: EstadoTurno.AUSENTE,
        ausenteAt: expect.any(Date),
      }),
    );

    jest.useRealTimers();
  });

  it('no debe marcar turnos dentro del umbral', async () => {
    const ahora = new Date();
    ahora.setHours(13, 15, 0, 0);

    const turnoReciente = {
      idTurno: 1,
      horaTurno: '13:00',
      estadoTurno: EstadoTurno.PROGRAMADO,
      ausenteAt: null,
      gimnasio: { idGimnasio: 1 },
    } as TurnoOrmEntity;

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoReciente]),
    };

    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);

    jest.useFakeTimers();
    jest.setSystemTime(ahora);

    await scheduler.marcarAusentesAutomaticos();

    expect(turnoRepository.save).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
