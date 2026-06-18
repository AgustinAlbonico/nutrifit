import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { MotivoCierreAutomatico } from 'src/domain/entities/Turno/motivo-cierre-automatico.enum';
import { FinalizarConsultaPorInactividadUseCase } from './finalizar-consulta-por-inactividad.use-case';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

function buildMockTurno(overrides: Partial<TurnoOrmEntity> = {}): TurnoOrmEntity {
  return {
    idTurno: 1,
    estadoTurno: EstadoTurno.EN_CURSO,
    consultaIniciadaAt: new Date(),
    cierreAutomatico: false,
    motivoCierreAutomatico: null,
    cierreAutomaticoEn: null,
    preavisoCierreAutoEnviadoEn: null,
    reabiertaPorCierreAuto: false,
    socio: { idPersona: 10 } as any,
    nutricionista: { idPersona: 20 } as any,
    ...overrides,
  } as TurnoOrmEntity;
}

describe('FinalizarConsultaPorInactividadUseCase', () => {
  let useCase: FinalizarConsultaPorInactividadUseCase;
  let turnoRepo: jest.Mocked<Repository<TurnoOrmEntity>>;
  let notificacionesService: jest.Mocked<NotificacionesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizarConsultaPorInactividadUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(FinalizarConsultaPorInactividadUseCase);
    turnoRepo = module.get(getRepositoryToken(TurnoOrmEntity));
    notificacionesService = module.get(NotificacionesService);
  });

  it('debe cerrar turno EN_CURSO con cierreAutomatico=true', async () => {
    const turno = buildMockTurno();
    turnoRepo.findOne.mockResolvedValue(turno);

    const result = await useCase.execute(1);

    expect(result.estado).toBe(EstadoTurno.REALIZADO);
    expect(turno.cierreAutomatico).toBe(true);
    expect(turno.motivoCierreAutomatico).toBe(MotivoCierreAutomatico.INACTIVIDAD);
    expect(turno.cierreAutomaticoEn).toBeInstanceOf(Date);
    expect(turno.estadoTurno).toBe(EstadoTurno.REALIZADO);
    expect(turnoRepo.save).toHaveBeenCalled();
    expect(notificacionesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: TipoNotificacion.CONSULTA_CERRADA_AUTO,
      }),
    );
  });

  it('debe lanzar error si el turno no esta EN_CURSO', async () => {
    const turno = buildMockTurno({ estadoTurno: EstadoTurno.REALIZADO });
    turnoRepo.findOne.mockResolvedValue(turno);
    await expect(useCase.execute(1)).rejects.toThrow('debe estar EN_CURSO');
  });

  it('debe lanzar error si el turno no existe', async () => {
    turnoRepo.findOne.mockResolvedValue(null);
    await expect(useCase.execute(999)).rejects.toThrow('no encontrado');
  });
});
