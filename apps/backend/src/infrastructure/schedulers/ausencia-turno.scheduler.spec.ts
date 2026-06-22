import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AusenciaTurnoScheduler } from './ausencia-turno.scheduler';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  POLITICA_OPERATIVA_REPOSITORY,
  IPoliticaOperativaRepository,
} from 'src/application/politicas/politica-operativa.repository';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import {
  formatArgentinaDate,
  getArgentinaNow,
  parseArgentinaDateInput,
} from 'src/common/utils/argentina-datetime.util';

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
        {
          provide: NotificacionesService,
          useValue: {
            crear: jest.fn().mockResolvedValue(undefined),
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

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debe marcar turnos como AUSENTE después del umbral', async () => {
    // "Hoy" en AR es la fecha de referencia. Simulamos que el reloj
    // de AR es 14:00 (2 horas después de un turno a las 13:00 con
    // umbral 30min → claramente ausente).
    const hoyArgentina = formatArgentinaDate(getArgentinaNow());
    const fechaTurnoDate = parseArgentinaDateInput(hoyArgentina);

    const turnoAtrasado = {
      idTurno: 1,
      fechaTurno: fechaTurnoDate,
      horaTurno: '13:00',
      estadoTurno: EstadoTurno.CONFIRMADO,
      ausenteAt: null,
      gimnasio: { idGimnasio: 1 },
    } as TurnoOrmEntity;

    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoAtrasado]),
    };

    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(
        queryBuilder as unknown as SelectQueryBuilder<TurnoOrmEntity>,
      );

    // Fijamos el reloj del sistema a 14:00 hora AR. Mockeamos
    // getArgentinaNow para no depender del timezone del server de tests.
    const ahora = new Date(`${hoyArgentina}T14:00:00-03:00`);
    jest.useFakeTimers().setSystemTime(ahora);
    jest
      .spyOn(require('src/common/utils/argentina-datetime.util'), 'getArgentinaNow')
      .mockReturnValue(ahora);

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
  });

  it('no debe marcar turnos dentro del umbral', async () => {
    const hoyArgentina = formatArgentinaDate(getArgentinaNow());
    const fechaTurnoDate = parseArgentinaDateInput(hoyArgentina);

    const turnoReciente = {
      idTurno: 1,
      fechaTurno: fechaTurnoDate,
      horaTurno: '14:30',
      estadoTurno: EstadoTurno.CONFIRMADO,
      ausenteAt: null,
      gimnasio: { idGimnasio: 1 },
    } as TurnoOrmEntity;

    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoReciente]),
    };

    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(
        queryBuilder as unknown as SelectQueryBuilder<TurnoOrmEntity>,
      );

    // Reloj AR = 14:00 → turno 14:30, dentro del umbral de 30min
    const ahora = new Date(`${hoyArgentina}T14:00:00-03:00`);
    jest.useFakeTimers().setSystemTime(ahora);
    jest
      .spyOn(require('src/common/utils/argentina-datetime.util'), 'getArgentinaNow')
      .mockReturnValue(ahora);

    await scheduler.marcarAusentesAutomaticos();

    expect(turnoRepository.save).not.toHaveBeenCalled();
  });
});
