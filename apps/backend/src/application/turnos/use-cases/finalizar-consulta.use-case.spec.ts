import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalizarConsultaUseCase } from './finalizar-consulta.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { ObservacionClinicaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

describe('FinalizarConsultaUseCase', () => {
  let useCase: FinalizarConsultaUseCase;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let medicionRepository: jest.Mocked<Repository<MedicionOrmEntity>>;
  let observacionRepository: jest.Mocked<Repository<ObservacionClinicaOrmEntity>>;
  let notificacionesService: jest.Mocked<NotificacionesService>;
  let auditoriaService: jest.Mocked<AuditoriaService>;

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
          provide: getRepositoryToken(MedicionOrmEntity),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ObservacionClinicaOrmEntity),
          useValue: {
            findOne: jest.fn(),
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
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<FinalizarConsultaUseCase>(FinalizarConsultaUseCase);
    turnoRepository = module.get<jest.Mocked<Repository<TurnoOrmEntity>>>(
      getRepositoryToken(TurnoOrmEntity),
    );
    medicionRepository = module.get<jest.Mocked<Repository<MedicionOrmEntity>>>(
      getRepositoryToken(MedicionOrmEntity),
    );
    observacionRepository = module.get<
      jest.Mocked<Repository<ObservacionClinicaOrmEntity>>
    >(getRepositoryToken(ObservacionClinicaOrmEntity));
    notificacionesService = module.get<jest.Mocked<NotificacionesService>>(
      NotificacionesService,
    );
    auditoriaService = module.get<jest.Mocked<AuditoriaService>>(
      AuditoriaService,
    );
  });

  it('debe finalizar consulta desde estado EN_CURSO', async () => {
    const turno = crearTurnoEnCurso();

    turnoRepository.findOne.mockResolvedValue(turno);
    medicionRepository.count.mockResolvedValue(1);
    observacionRepository.findOne.mockResolvedValue({
      comentario: 'Control completo',
    } as ObservacionClinicaOrmEntity);
    turnoRepository.save.mockResolvedValue({
      ...turno,
      estadoTurno: EstadoTurno.REALIZADO,
      consultaFinalizadaAt: expect.any(Date),
    } as TurnoOrmEntity);
    auditoriaService.registrar.mockResolvedValue(undefined);
    notificacionesService.crear.mockResolvedValue(undefined as never);

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
    turnoRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(999)).rejects.toThrow('Turno no encontrado');
  });

  it('debe lanzar error si turno no está EN_CURSO', async () => {
    const turno = {
      idTurno: 1,
      estadoTurno: EstadoTurno.PRESENTE,
      consultaFinalizadaAt: null,
    } as TurnoOrmEntity;

    turnoRepository.findOne.mockResolvedValue(turno);

    await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede finalizar consulta en un turno con estado PRESENTE',
    );
  });

  it('rechaza finalizar cuando no hay medicion base', async () => {
    turnoRepository.findOne.mockResolvedValue(crearTurnoEnCurso());
    medicionRepository.count.mockResolvedValue(0);
    observacionRepository.findOne.mockResolvedValue({
      comentario: 'Paciente con buena adherencia',
    } as ObservacionClinicaOrmEntity);

    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede finalizar la consulta. Faltantes: MEDICION_BASE',
    );
  });

  it('rechaza finalizar cuando no hay comentario clinico', async () => {
    turnoRepository.findOne.mockResolvedValue(crearTurnoEnCurso());
    medicionRepository.count.mockResolvedValue(1);
    observacionRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede finalizar la consulta. Faltantes: COMENTARIO_CLINICO',
    );
  });

  it('rechaza finalizar cuando el comentario clinico esta vacio', async () => {
    turnoRepository.findOne.mockResolvedValue(crearTurnoEnCurso());
    medicionRepository.count.mockResolvedValue(1);
    observacionRepository.findOne.mockResolvedValue({
      comentario: '   ',
    } as ObservacionClinicaOrmEntity);

    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede finalizar la consulta. Faltantes: COMENTARIO_CLINICO',
    );
  });
});

function crearTurnoEnCurso(): TurnoOrmEntity {
  return {
    idTurno: 1,
    estadoTurno: EstadoTurno.EN_CURSO,
    consultaFinalizadaAt: null,
    socio: { idPersona: 10, gimnasioId: 1 },
    nutricionista: { idPersona: 20 },
  } as TurnoOrmEntity;
}
