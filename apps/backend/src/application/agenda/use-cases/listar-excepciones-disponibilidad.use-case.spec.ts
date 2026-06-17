import { Test, TestingModule } from '@nestjs/testing';
import { ListarExcepcionesDisponibilidadUseCase } from './listar-excepciones-disponibilidad.use-case';
import { EXCEPCION_DISPONIBILIDAD_REPOSITORY } from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
import { ExcepcionDisponibilidadEntity } from 'src/domain/entities/Agenda/excepcion-disponibilidad.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const ahora = new Date();
const en1Dia = new Date(ahora.getTime() + MS_POR_DIA);
const en7Dias = new Date(ahora.getTime() + 7 * MS_POR_DIA);
const en30Dias = new Date(ahora.getTime() + 30 * MS_POR_DIA);
const en61Dias = new Date(ahora.getTime() + 61 * MS_POR_DIA);

const nutri5 = { idPersona: 5 } as unknown as NutricionistaEntity;

describe('ListarExcepcionesDisponibilidadUseCase', () => {
  let useCase: ListarExcepcionesDisponibilidadUseCase;
  let excepcionRepository: { findVigentesEnVentana: jest.Mock };
  let nutricionistaRepository: { findById: jest.Mock };

  beforeEach(async () => {
    excepcionRepository = { findVigentesEnVentana: jest.fn() };
    nutricionistaRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarExcepcionesDisponibilidadUseCase,
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
      ],
    }).compile();

    useCase = module.get(ListarExcepcionesDisponibilidadUseCase);
  });

  it('lista excepciones vigentes en la ventana indicada', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    excepcionRepository.findVigentesEnVentana.mockResolvedValue([
      new ExcepcionDisponibilidadEntity(
        nutri5,
        en1Dia,
        en7Dias,
        'Vacaciones',
        1,
      ),
    ]);

    const resultado = await useCase.execute(5, {
      fechaDesde: en1Dia.toISOString(),
      fechaHasta: en7Dias.toISOString(),
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      idExcepcion: 1,
      motivo: 'Vacaciones',
    });
    expect(excepcionRepository.findVigentesEnVentana).toHaveBeenCalledWith(
      5,
      expect.any(Date),
      expect.any(Date),
    );
  });

  it('usa ventana default de 60 dias si no se pasan query params', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    excepcionRepository.findVigentesEnVentana.mockResolvedValue([]);

    await useCase.execute(5, {});

    const callArgs: unknown[] = excepcionRepository.findVigentesEnVentana.mock
      .calls[0] as unknown[];
    const desdeArg = callArgs[1] as Date;
    const hastaArg = callArgs[2] as Date;
    const diffDias = (hastaArg.getTime() - desdeArg.getTime()) / MS_POR_DIA;
    expect(diffDias).toBeGreaterThanOrEqual(59);
    expect(diffDias).toBeLessThanOrEqual(60);
  });

  it('rechaza fechaDesde posterior a fechaHasta', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });

    await expect(
      useCase.execute(5, {
        fechaDesde: en7Dias.toISOString(),
        fechaHasta: en1Dia.toISOString(),
      }),
    ).rejects.toMatchObject({ constructor: BadRequestError });
  });

  it('rechaza ventana que excede los 60 dias desde hoy', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });

    await expect(
      useCase.execute(5, {
        fechaDesde: en1Dia.toISOString(),
        fechaHasta: en61Dias.toISOString(),
      }),
    ).rejects.toMatchObject({ constructor: BadRequestError });
  });

  it('lanza NotFoundError si el nutricionista no existe', async () => {
    nutricionistaRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(5, {})).rejects.toMatchObject({
      constructor: NotFoundError,
    });
  });

  it('devuelve lista vacia si no hay excepciones en la ventana', async () => {
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    excepcionRepository.findVigentesEnVentana.mockResolvedValue([]);

    const resultado = await useCase.execute(5, {
      fechaDesde: en1Dia.toISOString(),
      fechaHasta: en30Dias.toISOString(),
    });

    expect(resultado).toEqual([]);
  });
});
