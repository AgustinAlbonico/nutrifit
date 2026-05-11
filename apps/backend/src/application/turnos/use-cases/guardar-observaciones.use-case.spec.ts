import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuardarObservacionesUseCase } from './guardar-observaciones.use-case';
import { GuardarObservacionesDto } from '../dtos/guardar-observaciones.dto';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { ObservacionClinicaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

describe('GuardarObservacionesUseCase', () => {
  let useCase: GuardarObservacionesUseCase;
  let turnoRepository: Repository<TurnoOrmEntity>;
  let observacionRepository: Repository<ObservacionClinicaOrmEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardarObservacionesUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ObservacionClinicaOrmEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GuardarObservacionesUseCase>(
      GuardarObservacionesUseCase,
    );
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
    observacionRepository = module.get<Repository<ObservacionClinicaOrmEntity>>(
      getRepositoryToken(ObservacionClinicaOrmEntity),
    );
  });

  it('debe actualizar observación existente', async () => {
    const observacionExistente = {
      idObservacion: 1,
      comentario: 'Comentario viejo',
      sugerencias: null,
      habitosSocio: null,
      objetivosSocio: null,
    } as ObservacionClinicaOrmEntity;

    const turno = {
      idTurno: 1,
      observacionClinica: observacionExistente,
      consultaFinalizadaAt: null,
      estadoTurno: EstadoTurno.EN_CURSO,
    } as TurnoOrmEntity;

    const dto: GuardarObservacionesDto = {
      comentario: 'Nuevo comentario',
      sugerencias: 'Aumentar consumo de agua',
      habitosSocio: 'Sedentario',
      objetivosSocio: 'Bajar de peso',
    };

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);
    jest
      .spyOn(observacionRepository, 'save')
      .mockResolvedValue(observacionExistente);

    const result = await useCase.execute(1, dto);

    expect(result.success).toBe(true);
    expect(observacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        comentario: 'Nuevo comentario',
        sugerencias: 'Aumentar consumo de agua',
        habitosSocio: 'Sedentario',
        objetivosSocio: 'Bajar de peso',
      }),
    );
  });

  it('debe crear nueva observación con datos de medición', async () => {
    const turno = {
      idTurno: 1,
      observacionClinica: undefined,
      consultaFinalizadaAt: null,
      estadoTurno: EstadoTurno.EN_CURSO,
    } as TurnoOrmEntity;

    const medicion = {
      peso: 70,
      altura: 170,
      imc: 24.22,
    } as MedicionOrmEntity;

    const turnoConMedicion = {
      idTurno: 1,
      mediciones: [medicion],
      consultaFinalizadaAt: null,
    } as TurnoOrmEntity;

    const dto: GuardarObservacionesDto = {
      comentario: 'Primera consulta',
    };

    jest
      .spyOn(turnoRepository, 'findOne')
      .mockResolvedValueOnce(turno)
      .mockResolvedValueOnce(turnoConMedicion);

    const queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(turnoConMedicion),
    };

    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);

    const nuevaObservacion = {
      idObservacion: 2,
      comentario: 'Primera consulta',
      peso: 70,
      altura: 170,
      imc: 24.22,
      sugerencias: null,
      habitosSocio: null,
      objetivosSocio: null,
      esPublica: false,
      turno,
    } as unknown as ObservacionClinicaOrmEntity;

    jest
      .spyOn(observacionRepository, 'create')
      .mockReturnValue(nuevaObservacion);
    jest
      .spyOn(observacionRepository, 'save')
      .mockResolvedValue(nuevaObservacion);

    const result = await useCase.execute(1, dto);

    expect(result.success).toBe(true);
    expect(observacionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        comentario: 'Primera consulta',
        peso: 70,
        altura: 170,
        imc: 24.22,
      }),
    );
  });

  it('debe lanzar error si turno no existe', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    const dto: GuardarObservacionesDto = {
      comentario: 'Test',
    };

    await expect(useCase.execute(999, dto)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(999, dto)).rejects.toThrow(
      'Turno no encontrado',
    );
  });

  it('debe lanzar error si no hay mediciones previas al crear observación nueva', async () => {
    const turno = {
      idTurno: 1,
      observacionClinica: undefined,
      consultaFinalizadaAt: null,
      estadoTurno: EstadoTurno.EN_CURSO,
    } as TurnoOrmEntity;

    jest
      .spyOn(turnoRepository, 'findOne')
      .mockResolvedValueOnce(turno)
      .mockResolvedValueOnce({
        ...turno,
        mediciones: [],
      } as TurnoOrmEntity);

    const queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        idTurno: 1,
        mediciones: [],
        fechaTurno: new Date(),
        horaTurno: '10:00',
        estadoTurno: 'EN_CURSO',
      } as unknown as TurnoOrmEntity),
    };

    jest
      .spyOn(turnoRepository, 'createQueryBuilder')
      .mockReturnValue(queryBuilder as any);

    const dto: GuardarObservacionesDto = {
      comentario: 'Test',
    };

    await expect(useCase.execute(1, dto)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(1, dto)).rejects.toThrow(
      'No se puede crear observación sin mediciones previas',
    );
  });

  it('debe lanzar error si la consulta ya fue finalizada', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue({
      idTurno: 1,
      observacionClinica: undefined,
      consultaFinalizadaAt: new Date('2026-05-07T10:00:00Z'),
      estadoTurno: EstadoTurno.REALIZADO,
    } as TurnoOrmEntity);

    await expect(
      useCase.execute(1, { comentario: 'Observación final' }),
    ).rejects.toThrow(
      'No se pueden agregar observaciones a una consulta ya finalizada',
    );
  });

  it('debe lanzar error si el turno no está EN_CURSO', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue({
      idTurno: 1,
      observacionClinica: undefined,
      consultaFinalizadaAt: null,
      estadoTurno: EstadoTurno.PRESENTE,
    } as TurnoOrmEntity);

    await expect(
      useCase.execute(1, { comentario: 'Observación previa' }),
    ).rejects.toThrow(
      'Solo se pueden guardar observaciones durante una consulta en curso. Estado actual: PRESENTE',
    );
  });
});
