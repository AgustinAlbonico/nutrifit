import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalizarConsultaUseCase } from './finalizar-consulta.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

describe('FinalizarConsultaUseCase', () => {
  let useCase: FinalizarConsultaUseCase;
  let turnoRepository: Repository<TurnoOrmEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizarConsultaUseCase,
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
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<FinalizarConsultaUseCase>(FinalizarConsultaUseCase);
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
  });

  it('debe finalizar consulta desde estado EN_CURSO', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.EN_CURSO,
      consultaFinalizadaAt: null,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue({
      ...turno,
      estadoTurno: EstadoTurno.REALIZADO,
      consultaFinalizadaAt: expect.any(Date),
    });

    const result = await useCase.execute(1);

    expect(result.success).toBe(true);
    expect(result.estado).toBe(EstadoTurno.REALIZADO);
    expect(turnoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoTurno: EstadoTurno.REALIZADO,
        consultaFinalizadaAt: expect.any(Date),
      }),
    );
  });

  it('debe lanzar error si turno no existe', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(999)).rejects.toThrow('Turno no encontrado');
  });

  it('debe lanzar error si turno no está EN_CURSO', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.PRESENTE,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);

    await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede finalizar consulta en un turno con estado PRESENTE',
    );
  });
});
