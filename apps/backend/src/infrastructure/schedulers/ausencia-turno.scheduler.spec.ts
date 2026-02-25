import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AusenciaTurnoScheduler } from './ausencia-turno.scheduler';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { SchedulerConfig } from 'src/domain/config/scheduler.config';

describe('AusenciaTurnoScheduler', () => {
  let scheduler: AusenciaTurnoScheduler;
  let turnoRepository: Repository<TurnoOrmEntity>;
  let schedulerConfig: SchedulerConfig;

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
          provide: 'SchedulerConfig',
          useValue: {
            getAusenciaUmbralMinutos: jest.fn().mockReturnValue(30),
          },
        },
      ],
    }).compile();

    scheduler = module.get<AusenciaTurnoScheduler>(AusenciaTurnoScheduler);
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
    schedulerConfig = module.get<SchedulerConfig>('SchedulerConfig');
  });

  it('debe marcar turnos como AUSENTE después del umbral', async () => {
    const ahora = new Date();
    ahora.setHours(14, 0, 0, 0); // 14:00

    const turnoAtrasado = {
      idTurno: 1,
      horaTurno: '13:00',
      estadoTurno: EstadoTurno.PENDIENTE,
      ausenteAt: null,
    } as TurnoOrmEntity;

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoAtrasado]),
    };

    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue(turnoAtrasado);

    // Mock date
    jest.spyOn(global, 'Date').mockImplementation(() => ahora as any);

    await scheduler.marcarAusentesAutomaticos();

    expect(turnoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoTurno: EstadoTurno.AUSENTE,
        ausenteAt: expect.any(Date),
      }),
    );
  });

  it('no debe marcar turnos dentro del umbral', async () => {
    const ahora = new Date();
    ahora.setHours(13, 15, 0, 0); // 13:15

    const turnoReciente = {
      idTurno: 1,
      horaTurno: '13:00',
      estadoTurno: EstadoTurno.PENDIENTE,
      ausenteAt: null,
    } as TurnoOrmEntity;

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoReciente]),
    };

    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue(turnoReciente);

    jest.spyOn(global, 'Date').mockImplementation(() => ahora as any);

    await scheduler.marcarAusentesAutomaticos();

    expect(turnoRepository.save).not.toHaveBeenCalled();
  });
});
