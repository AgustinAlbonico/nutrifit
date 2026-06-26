import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import {
  FichaSaludOrmEntity,
  SocioOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { GetFichaSaludPacienteUseCase } from './get-ficha-salud-paciente.use-case';
import { AbrirFichaDesdeTurnoUseCase } from './abrir-ficha-desde-turno.use-case';

describe('GetFichaSaludPacienteUseCase', () => {
  let useCase: GetFichaSaludPacienteUseCase;
  let turnoRepository: { count: jest.Mock; findOne: jest.Mock };
  let socioRepository: { findOne: jest.Mock };
  let nutricionistaRepository: { findById: jest.Mock };
  let abrirFichaDesdeTurnoUseCase: { execute: jest.Mock };
  let tenantContext: { gimnasioId: number };

  const nutricionistaId = 10;
  const socioId = 20;
  const gimnasioId = 1;

  beforeEach(async () => {
    turnoRepository = { count: jest.fn(), findOne: jest.fn() };
    socioRepository = { findOne: jest.fn() };
    nutricionistaRepository = { findById: jest.fn() };
    abrirFichaDesdeTurnoUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    tenantContext = { gimnasioId };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFichaSaludPacienteUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: turnoRepository,
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: socioRepository,
        },
        {
          provide: AbrirFichaDesdeTurnoUseCase,
          useValue: abrirFichaDesdeTurnoUseCase,
        },
        {
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: nutricionistaRepository,
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        { provide: TenantContextService, useValue: tenantContext },
      ],
    }).compile();

    useCase = module.get(GetFichaSaludPacienteUseCase);
  });

  it('lanza NotFoundError si el nutricionista no existe', async () => {
    nutricionistaRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(nutricionistaId, socioId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza NotFoundError si el socio no existe', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: nutricionistaId,
    });
    socioRepository.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute(nutricionistaId, socioId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza ForbiddenError si el nutricionista no tiene turnos con el socio', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: nutricionistaId,
    });
    socioRepository.findOne.mockResolvedValue({
      idPersona: socioId,
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      fichaSalud: { idFichaSalud: 1, altura: 1.7, peso: 70 },
    });
    turnoRepository.count.mockResolvedValue(0);

    await expect(
      useCase.execute(nutricionistaId, socioId),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('retorna null si el socio no tiene ficha de salud', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: nutricionistaId,
    });
    socioRepository.findOne.mockResolvedValue({
      idPersona: socioId,
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      fichaSalud: null,
    });
    turnoRepository.count.mockResolvedValue(1);

    const result = await useCase.execute(nutricionistaId, socioId);
    expect(result).toBeNull();
  });

  it('delega en AbrirFichaDesdeTurnoUseCase al leer la ficha (RB45 single source of truth)', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: nutricionistaId,
    });
    socioRepository.findOne.mockResolvedValue({
      idPersona: socioId,
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      fichaSalud: {
        idFichaSalud: 1,
        altura: 1.7,
        peso: 70,
        nivelActividadFisica: 'MODERADO',
        objetivoPersonal: 'Bajar de peso',
        alergias: [],
        patologias: [],
        revisadaPorNutricionistaAt: null,
      },
    });
    turnoRepository.count.mockResolvedValue(1);
    turnoRepository.findOne.mockResolvedValue({ idTurno: 99 });

    await useCase.execute(nutricionistaId, socioId);

    expect(abrirFichaDesdeTurnoUseCase.execute).toHaveBeenCalledTimes(1);
    expect(abrirFichaDesdeTurnoUseCase.execute).toHaveBeenCalledWith({
      turnoId: 99,
      nutricionistaId,
      socioId,
    });
  });

  it('no delega en AbrirFichaDesdeTurnoUseCase si no hay turno previo (consulta 1 query, no falla)', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: nutricionistaId,
    });
    socioRepository.findOne.mockResolvedValue({
      idPersona: socioId,
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      fichaSalud: {
        idFichaSalud: 1,
        altura: 1.7,
        peso: 70,
        nivelActividadFisica: 'MODERADO',
        objetivoPersonal: 'Bajar de peso',
        alergias: [],
        patologias: [],
        revisadaPorNutricionistaAt: null,
      },
    });
    turnoRepository.count.mockResolvedValue(1);
    turnoRepository.findOne.mockResolvedValue(null);

    const result = await useCase.execute(nutricionistaId, socioId);

    expect(abrirFichaDesdeTurnoUseCase.execute).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result!.socioId).toBe(socioId);
  });

  it('retorna la ficha del socio cuando todo es válido', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: nutricionistaId,
    });
    socioRepository.findOne.mockResolvedValue({
      idPersona: socioId,
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      fichaSalud: {
        idFichaSalud: 1,
        altura: 1.7,
        peso: 70,
        nivelActividadFisica: 'MODERADO',
        objetivoPersonal: 'Bajar de peso',
        alergias: [{ nombre: 'Maní' }],
        patologias: [],
        revisadaPorNutricionistaAt: null,
      },
    });
    turnoRepository.count.mockResolvedValue(1);
    turnoRepository.findOne.mockResolvedValue({ idTurno: 99 });

    const result = await useCase.execute(nutricionistaId, socioId);

    expect(result).not.toBeNull();
    expect(result!.socioId).toBe(socioId);
    expect(result!.nombreCompleto).toBe('Juan Pérez');
    expect(result!.altura).toBe(1.7);
    expect(result!.peso).toBe(70);
    expect(result!.alergias).toEqual(['Maní']);
  });
});
