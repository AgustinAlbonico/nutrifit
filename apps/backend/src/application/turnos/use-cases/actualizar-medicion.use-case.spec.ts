import { Repository } from 'typeorm';
import { ActualizarMedicionDto } from '../dtos/actualizar-medicion.dto';
import { ActualizarMedicionUseCase } from './actualizar-medicion.use-case';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';

type TurnoRepositoryMock = Pick<Repository<TurnoOrmEntity>, 'findOne'>;
type MedicionRepositoryMock = Pick<
  Repository<MedicionOrmEntity>,
  'findOne' | 'save'
>;

describe('ActualizarMedicionUseCase', () => {
  let useCase: ActualizarMedicionUseCase;
  let turnoRepository: jest.Mocked<TurnoRepositoryMock>;
  let medicionRepository: jest.Mocked<MedicionRepositoryMock>;

  const tenantContext = {
    gimnasioId: 10,
    personaId: 20,
  } as TenantContextService;

  beforeEach(() => {
    turnoRepository = {
      findOne: jest.fn(),
    };
    medicionRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    useCase = new ActualizarMedicionUseCase(
      turnoRepository as unknown as Repository<TurnoOrmEntity>,
      medicionRepository as unknown as Repository<MedicionOrmEntity>,
      tenantContext,
    );
  });

  it('debe actualizar la medición del turno y recalcular IMC sin crear duplicados', async () => {
    const turno = crearTurno({ idTurno: 1 });
    const medicion = crearMedicion({ idMedicion: 5, turno });
    const dto: ActualizarMedicionDto = {
      peso: 72,
      altura: 180,
      perimetroCintura: 82,
      porcentajeGrasa: 25,
    };

    turnoRepository.findOne.mockResolvedValue(turno);
    medicionRepository.findOne.mockResolvedValue(medicion);
    medicionRepository.save.mockResolvedValue(medicion);

    const resultado = await useCase.execute(1, 5, dto);

    expect(resultado).toEqual({ success: true, imc: 22.22, idMedicion: 5 });
    expect(medicionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        idMedicion: 5,
        peso: 72,
        altura: 180,
        imc: 22.22,
        perimetroCintura: 82,
        masaMagra: 54,
      }),
    );
  });

  it('debe lanzar NotFoundError si el turno no existe en el gimnasio del tenant', async () => {
    turnoRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(99, 5, { peso: 72 })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('debe lanzar ForbiddenError si el turno pertenece a otro nutricionista del mismo gimnasio', async () => {
    turnoRepository.findOne.mockResolvedValue(
      crearTurno({ idTurno: 1, nutricionistaId: 99 }),
    );

    await expect(useCase.execute(1, 5, { peso: 72 })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('debe lanzar NotFoundError si la medición no existe', async () => {
    turnoRepository.findOne.mockResolvedValue(crearTurno({ idTurno: 1 }));
    medicionRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(1, 5, { peso: 72 })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('debe lanzar BadRequestError si la medición no pertenece al turno indicado', async () => {
    const turno = crearTurno({ idTurno: 1 });
    const otroTurno = crearTurno({ idTurno: 2 });
    turnoRepository.findOne.mockResolvedValue(turno);
    medicionRepository.findOne.mockResolvedValue(
      crearMedicion({ idMedicion: 5, turno: otroTurno }),
    );

    await expect(useCase.execute(1, 5, { peso: 72 })).rejects.toThrow(
      'La medición no pertenece al turno indicado',
    );
  });

  it('debe rechazar edición si la consulta ya fue finalizada', async () => {
    turnoRepository.findOne.mockResolvedValue(
      crearTurno({
        idTurno: 1,
        consultaFinalizadaAt: new Date('2026-07-03T10:00:00Z'),
      }),
    );

    await expect(useCase.execute(1, 5, { peso: 72 })).rejects.toThrow(
      'No se pueden editar mediciones de una consulta ya finalizada',
    );
  });

  it('debe rechazar edición si el turno no está en curso', async () => {
    turnoRepository.findOne.mockResolvedValue(
      crearTurno({ idTurno: 1, estadoTurno: EstadoTurno.PRESENTE }),
    );

    await expect(useCase.execute(1, 5, { peso: 72 })).rejects.toThrow(
      'Solo se pueden editar mediciones durante una consulta en curso. Estado actual: PRESENTE',
    );
  });

  it('debe validar tensión arterial completa', async () => {
    const turno = crearTurno({ idTurno: 1 });
    turnoRepository.findOne.mockResolvedValue(turno);
    medicionRepository.findOne.mockResolvedValue(crearMedicion({ turno }));

    await expect(
      useCase.execute(1, 5, { tensionSistolica: 120 }),
    ).rejects.toThrow(BadRequestError);
  });

  it('debe permitir actualizar solo tensión sistólica si la diastólica ya existe en la medición', async () => {
    const turno = crearTurno({ idTurno: 1 });
    const medicion = crearMedicion({ turno });
    medicion.tensionDiastolica = 80;
    turnoRepository.findOne.mockResolvedValue(turno);
    medicionRepository.findOne.mockResolvedValue(medicion);
    medicionRepository.save.mockResolvedValue(medicion);

    await expect(
      useCase.execute(1, 5, { tensionSistolica: 125 }),
    ).resolves.toEqual({ success: true, imc: 24.22, idMedicion: 5 });
    expect(medicionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tensionSistolica: 125,
        tensionDiastolica: 80,
      }),
    );
  });
});

function crearTurno(overrides: {
  idTurno: number;
  nutricionistaId?: number;
  estadoTurno?: EstadoTurno;
  consultaFinalizadaAt?: Date | null;
}): TurnoOrmEntity {
  return {
    idTurno: overrides.idTurno,
    estadoTurno: overrides.estadoTurno ?? EstadoTurno.EN_CURSO,
    consultaFinalizadaAt: overrides.consultaFinalizadaAt ?? null,
    nutricionista: {
      idPersona: overrides.nutricionistaId ?? 20,
    } as NutricionistaOrmEntity,
  } as TurnoOrmEntity;
}

function crearMedicion(overrides: {
  idMedicion?: number;
  turno: TurnoOrmEntity;
}): MedicionOrmEntity {
  return {
    idMedicion: overrides.idMedicion ?? 5,
    peso: 70,
    altura: 170,
    imc: 24.22,
    perimetroCintura: 80,
    perimetroCadera: null,
    perimetroBrazo: null,
    perimetroMuslo: null,
    perimetroPecho: null,
    pliegueTriceps: null,
    pliegueAbdominal: null,
    pliegueMuslo: null,
    porcentajeGrasa: 20,
    masaMagra: 56,
    frecuenciaCardiaca: null,
    tensionSistolica: null,
    tensionDiastolica: null,
    notasMedicion: null,
    turno: overrides.turno,
  } as MedicionOrmEntity;
}
