import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GuardarMedicionesUseCase,
  GuardarMedicionesDto,
} from './guardar-mediciones.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

describe('GuardarMedicionesUseCase', () => {
  let useCase: GuardarMedicionesUseCase;
  let turnoRepository: Repository<TurnoOrmEntity>;
  let medicionRepository: Repository<MedicionOrmEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardarMedicionesUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MedicionOrmEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GuardarMedicionesUseCase>(GuardarMedicionesUseCase);
    turnoRepository = module.get<Repository<TurnoOrmEntity>>(
      getRepositoryToken(TurnoOrmEntity),
    );
    medicionRepository = module.get<Repository<MedicionOrmEntity>>(
      getRepositoryToken(MedicionOrmEntity),
    );
  });

  it('debe calcular IMC correctamente y guardar medición', async () => {
    const turno = { idTurno: 1 } as TurnoOrmEntity;
    const dto: GuardarMedicionesDto = {
      peso: 70,
      altura: 170,
      perimetroCintura: 80,
      perimetroCadera: 95,
    };

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);

    const medicionCreada = {
      peso: 70,
      altura: 170,
      imc: 24.22,
      perimetroCintura: 80,
      perimetroCadera: 95,
      turno,
    } as MedicionOrmEntity;

    jest.spyOn(medicionRepository, 'create').mockReturnValue(medicionCreada);
    jest.spyOn(medicionRepository, 'save').mockResolvedValue(medicionCreada);

    const result = await useCase.execute(1, dto);

    expect(result.success).toBe(true);
    expect(result.imc).toBe(24.22);
    expect(medicionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        peso: 70,
        altura: 170,
        imc: 24.22,
        perimetroCintura: 80,
        perimetroCadera: 95,
      }),
    );
  });

  it('debe calcular IMC para persona con bajo peso', async () => {
    const turno = { idTurno: 1 } as TurnoOrmEntity;
    const dto: GuardarMedicionesDto = {
      peso: 50,
      altura: 170,
    };

    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(turno);

    const medicionCreada = {
      peso: 50,
      altura: 170,
      imc: 17.3,
      perimetroCintura: null,
      perimetroCadera: null,
      turno,
    } as MedicionOrmEntity;

    jest.spyOn(medicionRepository, 'create').mockReturnValue(medicionCreada);
    jest.spyOn(medicionRepository, 'save').mockResolvedValue(medicionCreada);

    const result = await useCase.execute(1, dto);

    expect(result.success).toBe(true);
    expect(result.imc).toBe(17.3);
  });

  it('debe lanzar error si turno no existe', async () => {
    jest.spyOn(turnoRepository, 'findOne').mockResolvedValue(null);

    const dto: GuardarMedicionesDto = {
      peso: 70,
      altura: 170,
    };

    await expect(useCase.execute(999, dto)).rejects.toThrow(BadRequestError);
    await expect(useCase.execute(999, dto)).rejects.toThrow(
      'Turno no encontrado',
    );
  });
});
