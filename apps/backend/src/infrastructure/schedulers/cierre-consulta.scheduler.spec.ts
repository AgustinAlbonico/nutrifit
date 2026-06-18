import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CierreConsultaScheduler } from './cierre-consulta.scheduler';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { FinalizarConsultaPorInactividadUseCase } from 'src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case';
import { POLITICA_OPERATIVA_REPOSITORY, IPoliticaOperativaRepository } from 'src/application/politicas/politica-operativa.repository';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

function buildMockTurno(overrides: Partial<TurnoOrmEntity> = {}): TurnoOrmEntity {
  return {
    idTurno: 1,
    estadoTurno: EstadoTurno.EN_CURSO,
    consultaIniciadaAt: new Date(Date.now() - 31 * 60 * 1000),
    preavisoCierreAutoEnviadoEn: null,
    gimnasio: { idGimnasio: 1 } as any,
    nutricionista: { idPersona: 20, nombre: 'Dr', apellido: 'Test' } as any,
    ...overrides,
  } as TurnoOrmEntity;
}

function createQbMock(result: TurnoOrmEntity[]) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
  };
}

describe('CierreConsultaScheduler', () => {
  let scheduler: CierreConsultaScheduler;
  let turnoRepo: jest.Mocked<Repository<TurnoOrmEntity>>;
  let politicaRepo: jest.Mocked<IPoliticaOperativaRepository>;
  let finalizarUseCase: jest.Mocked<FinalizarConsultaPorInactividadUseCase>;
  let notifService: jest.Mocked<NotificacionesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CierreConsultaScheduler,
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
            getUmbralCierreConsultaMin: jest.fn().mockResolvedValue(30),
            getPreavisoCierreConsultaMin: jest.fn().mockResolvedValue(5),
          },
        },
        {
          provide: FinalizarConsultaPorInactividadUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn() },
        },
      ],
    }).compile();

    scheduler = module.get(CierreConsultaScheduler);
    turnoRepo = module.get(getRepositoryToken(TurnoOrmEntity));
    politicaRepo = module.get(POLITICA_OPERATIVA_REPOSITORY);
    finalizarUseCase = module.get(FinalizarConsultaPorInactividadUseCase);
    notifService = module.get(NotificacionesService);
  });

  it('debe cerrar turnos que superaron el umbral', async () => {
    const turnoViejo = buildMockTurno({
      consultaIniciadaAt: new Date(Date.now() - 31 * 60 * 1000),
    });
    (turnoRepo.createQueryBuilder as jest.Mock).mockReturnValue(createQbMock([turnoViejo]));

    await scheduler.ejecutarCierreAutomatico();

    expect(finalizarUseCase.execute).toHaveBeenCalledWith(turnoViejo.idTurno);
  });

  it('debe enviar preaviso si esta en la ventana', async () => {
    const turnoPreaviso = buildMockTurno({
      consultaIniciadaAt: new Date(Date.now() - 26 * 60 * 1000),
    });
    (turnoRepo.createQueryBuilder as jest.Mock).mockReturnValue(createQbMock([turnoPreaviso]));

    await scheduler.ejecutarCierreAutomatico();

    expect(notifService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: TipoNotificacion.CONSULTA_PREAVISO_CIERRE_AUTO,
      }),
    );
    expect(turnoRepo.save).toHaveBeenCalled();
  });

  it('no debe enviar preaviso repetido si ya se envio', async () => {
    const turnoPreavisado = buildMockTurno({
      preavisoCierreAutoEnviadoEn: new Date(),
    });
    (turnoRepo.createQueryBuilder as jest.Mock).mockReturnValue(createQbMock([turnoPreavisado]));

    await scheduler.ejecutarCierreAutomatico();

    expect(notifService.crear).not.toHaveBeenCalled();
  });

  it('no debe hacer nada si no hay turnos EN_CURSO', async () => {
    (turnoRepo.createQueryBuilder as jest.Mock).mockReturnValue(createQbMock([]));

    await scheduler.ejecutarCierreAutomatico();

    expect(finalizarUseCase.execute).not.toHaveBeenCalled();
    expect(notifService.crear).not.toHaveBeenCalled();
  });
});
