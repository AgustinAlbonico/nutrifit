import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CrearExcepcionDisponibilidadUseCase } from './crear-excepcion-disponibilidad.use-case';
import { EXCEPCION_DISPONIBILIDAD_REPOSITORY } from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
import { ExcepcionDisponibilidadEntity } from 'src/domain/entities/Agenda/excepcion-disponibilidad.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const ahora = new Date();
const en1Hora = new Date(ahora.getTime() + 60 * 60 * 1000);
const en7Dias = new Date(ahora.getTime() + 7 * MS_POR_DIA);
const en59Dias = new Date(ahora.getTime() + 59 * MS_POR_DIA);
const en61Dias = new Date(ahora.getTime() + 61 * MS_POR_DIA);
const ayer = new Date(ahora.getTime() - MS_POR_DIA);

const nutri5 = { idPersona: 5 } as unknown as NutricionistaEntity;

function buildExcepcion(
  id: number,
  fechaInicio: Date,
  fechaFin: Date,
  motivo: string | null,
): ExcepcionDisponibilidadEntity {
  return new ExcepcionDisponibilidadEntity(
    nutri5,
    fechaInicio,
    fechaFin,
    motivo,
    id,
  );
}

function buildTurnoReservado(
  idTurno: number,
  fecha: Date,
  socioId: number,
  nombre: string,
  apellido: string,
): Partial<TurnoOrmEntity> {
  return {
    idTurno,
    fechaTurno: fecha,
    horaTurno: '10:00:00',
    estadoTurno: EstadoTurno.CONFIRMADO,
    socio: { idPersona: socioId, nombre, apellido } as TurnoOrmEntity['socio'],
  };
}

describe('CrearExcepcionDisponibilidadUseCase', () => {
  let useCase: CrearExcepcionDisponibilidadUseCase;
  let excepcionRepository: { save: jest.Mock };
  let nutricionistaRepository: { findById: jest.Mock };
  let turnoRepository: { createQueryBuilder: jest.Mock };
  let tenantContext: { gimnasioId: number };

  beforeEach(async () => {
    excepcionRepository = { save: jest.fn() };
    nutricionistaRepository = { findById: jest.fn() };
    turnoRepository = { createQueryBuilder: jest.fn() };
    tenantContext = { gimnasioId: 1 };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrearExcepcionDisponibilidadUseCase,
        {
          provide: EXCEPCION_DISPONIBILIDAD_REPOSITORY,
          useValue: excepcionRepository,
        },
        {
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: nutricionistaRepository,
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: turnoRepository,
        },
        { provide: TenantContextService, useValue: tenantContext },
      ],
    }).compile();

    useCase = module.get(CrearExcepcionDisponibilidadUseCase);
  });

  function mockQueryBuilderConTurnos(turnos: Partial<TurnoOrmEntity>[]) {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(turnos),
    };
    turnoRepository.createQueryBuilder.mockReturnValue(qb);
    return qb;
  }

  it('crea excepcion sin turnos afectados y devuelve DTO con idExcepcion', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    mockQueryBuilderConTurnos([]);

    excepcionRepository.save.mockResolvedValue(
      buildExcepcion(42, en1Hora, en7Dias, 'Vacaciones'),
    );

    const resultado = await useCase.execute(5, {
      fechaInicio: en1Hora.toISOString(),
      fechaFin: en7Dias.toISOString(),
      motivo: 'Vacaciones',
    });

    expect(resultado).toMatchObject({
      idExcepcion: 42,
      motivo: 'Vacaciones',
    });
    expect(excepcionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('lanza ConflictError con turnosAfectados cuando hay reservados y no se confirma', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    mockQueryBuilderConTurnos([
      buildTurnoReservado(100, en7Dias, 77, 'Juan', 'Pérez'),
    ]);

    await expect(
      useCase.execute(5, {
        fechaInicio: en1Hora.toISOString(),
        fechaFin: en7Dias.toISOString(),
      }),
    ).rejects.toMatchObject({
      constructor: ConflictError,
      context: {
        requiereConfirmacion: true,
        turnosAfectados: expect.arrayContaining([
          expect.objectContaining({ idTurno: 100 }),
        ]) as unknown[],
      },
    });

    expect(excepcionRepository.save).not.toHaveBeenCalled();
  });

  it('crea excepcion con turnos afectados cuando confirmarConTurnosOcupados=true', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    mockQueryBuilderConTurnos([
      buildTurnoReservado(100, en7Dias, 77, 'A', 'B'),
    ]);

    excepcionRepository.save.mockResolvedValue(
      buildExcepcion(7, en1Hora, en7Dias, null),
    );

    const resultado = await useCase.execute(5, {
      fechaInicio: en1Hora.toISOString(),
      fechaFin: en7Dias.toISOString(),
      confirmarConTurnosOcupados: true,
    });

    expect(resultado.idExcepcion).toBe(7);
    expect(resultado.turnosAfectados).toHaveLength(1);
  });

  it('rechaza fechaFin anterior o igual a fechaInicio', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });

    await expect(
      useCase.execute(5, {
        fechaInicio: en7Dias.toISOString(),
        fechaFin: en1Hora.toISOString(),
      }),
    ).rejects.toMatchObject({ constructor: BadRequestError });
  });

  it('rechaza fechaFin fuera de la ventana de 60 dias', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });

    await expect(
      useCase.execute(5, {
        fechaInicio: en1Hora.toISOString(),
        fechaFin: en61Dias.toISOString(),
      }),
    ).rejects.toMatchObject({ constructor: BadRequestError });
  });

  it('acepta fechaFin claramente dentro de la ventana de 60 dias', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    mockQueryBuilderConTurnos([]);

    excepcionRepository.save.mockResolvedValue(
      buildExcepcion(1, en1Hora, en59Dias, null),
    );

    const resultado = await useCase.execute(5, {
      fechaInicio: en1Hora.toISOString(),
      fechaFin: en59Dias.toISOString(),
    });

    expect(resultado.idExcepcion).toBe(1);
  });

  it('rechaza fechaInicio en el pasado', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });

    await expect(
      useCase.execute(5, {
        fechaInicio: ayer.toISOString(),
        fechaFin: en7Dias.toISOString(),
      }),
    ).rejects.toMatchObject({ constructor: BadRequestError });
  });

  it('rechaza motivo de mas de 255 caracteres', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });

    await expect(
      useCase.execute(5, {
        fechaInicio: en1Hora.toISOString(),
        fechaFin: en7Dias.toISOString(),
        motivo: 'x'.repeat(256),
      }),
    ).rejects.toMatchObject({ constructor: BadRequestError });
  });

  it('lanza NotFoundError cuando el nutricionista no existe', async () => {
    nutricionistaRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(5, {
        fechaInicio: en1Hora.toISOString(),
        fechaFin: en7Dias.toISOString(),
      }),
    ).rejects.toMatchObject({ constructor: NotFoundError });
  });

  it('acepta motivo null y persiste sin motivo', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    mockQueryBuilderConTurnos([]);

    excepcionRepository.save.mockResolvedValue(
      buildExcepcion(1, en1Hora, en7Dias, null),
    );

    const resultado = await useCase.execute(5, {
      fechaInicio: en1Hora.toISOString(),
      fechaFin: en7Dias.toISOString(),
      motivo: null,
    });

    expect(resultado.motivo).toBeNull();
  });

  it('filtra turnos por gimnasio del nutri logueado (multi-tenant)', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    mockQueryBuilderConTurnos([]);

    excepcionRepository.save.mockResolvedValue(
      buildExcepcion(9, en1Hora, en7Dias, null),
    );

    await useCase.execute(5, {
      fechaInicio: en1Hora.toISOString(),
      fechaFin: en7Dias.toISOString(),
    });

    const qb = turnoRepository.createQueryBuilder.mock.results[0].value as {
      andWhere: { mock: { calls: [string, unknown][] } };
    };
    const andWhereCalls: string[] = qb.andWhere.mock.calls.map((c) => c[0]);
    expect(
      andWhereCalls.some(
        (sql) => sql.includes('gimnasioId') || sql.includes('nutricionista'),
      ),
    ).toBe(true);
  });
});
