import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckInTurnoUseCase } from './check-in-turno.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';

describe('CheckInTurnoUseCase', () => {
  let useCase: CheckInTurnoUseCase;
  let turnoRepository: Repository<TurnoOrmEntity>;
  let notificacionesService: jest.Mocked<NotificacionesService>;

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
        {
          provide: NotificacionesService,
          useValue: {
            crear: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CheckInTurnoUseCase>(CheckInTurnoUseCase);
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
    notificacionesService = module.get(NotificacionesService);
  });

  it('debe hacer check-in y notificar al socio y al profesional', async () => {
    const mockTurno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.PROGRAMADO,
      socio: { idPersona: 20, nombre: 'Juan' },
      nutricionista: { idPersona: 10, nombre: 'Dr. Test' },
      checkInAt: null,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(mockTurno);
    jest.spyOn(turnoRepository, 'save').mockResolvedValue({
      ...mockTurno,
      estadoTurno: EstadoTurno.PRESENTE,
      checkInAt: expect.any(Date),
    });

    const result = await useCase.execute(1);

    expect(result.success).toBe(true);
    expect(result.estado).toBe(EstadoTurno.PRESENTE);
    expect(notificacionesService.crear).toHaveBeenCalledTimes(2);
    expect(notificacionesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioId: 20,
        tipo: 'CHECK_IN',
        titulo: 'Check-in registrado',
      }),
    );
    expect(notificacionesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioId: 10,
        tipo: 'CHECK_IN',
        titulo: 'Socio realizó check-in',
      }),
    );
  });

  it('debe lanzar error si turno no existe', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(999)).rejects.toThrow('Turno no encontrado');
  });

  it('debe lanzar error si turno no está en estado PROGRAMADO', async () => {
    const mockTurno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.PRESENTE,
    } as TurnoOrmEntity;

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(mockTurno);

    await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
  });
});
