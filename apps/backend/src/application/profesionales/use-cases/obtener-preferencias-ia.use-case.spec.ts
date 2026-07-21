import { ObtenerPreferenciasIaUseCase } from './obtener-preferencias-ia.use-case';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

describe('ObtenerPreferenciasIaUseCase', () => {
  let useCase: ObtenerPreferenciasIaUseCase;
  let nutricionistaRepository: jest.Mocked<NutricionistaRepository>;

  const buildNutricionista = (
    preferenciasIa: string | null,
  ): NutricionistaEntity => {
    const entity = new NutricionistaEntity(
      1,
      'Ana',
      'García',
      new Date('1985-05-15'),
      '1144556677',
      Genero.Femenino,
      'Calle 123',
      'CABA',
      'Buenos Aires',
      '98765432',
      10,
      500,
      [],
      [],
      [],
      [],
      [],
      null,
      'ana@nutrifit.com',
      null,
      30,
      null,
      preferenciasIa,
    );
    entity.gimnasioId = 1;
    return entity;
  };

  beforeEach(() => {
    nutricionistaRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByEmail: jest.fn(),
      findByDni: jest.fn(),
      findByMatricula: jest.fn(),
    } as unknown as jest.Mocked<NutricionistaRepository>;

    useCase = new ObtenerPreferenciasIaUseCase(nutricionistaRepository, {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any);
  });

  it('retorna el string de preferencias cuando el nutricionista tiene notas', async () => {
    const preferencias =
      'Priorizar proteínas de alto valor biológico. Evitar ultraprocesados.';
    nutricionistaRepository.findById.mockResolvedValue(
      buildNutricionista(preferencias),
    );

    const result = await useCase.execute({ nutricionistaId: 1 });

    expect(result).toEqual({ preferencias });
    expect(nutricionistaRepository.findById).toHaveBeenCalledWith(1);
  });

  it('retorna string vacío cuando el nutricionista no tiene notas (null)', async () => {
    nutricionistaRepository.findById.mockResolvedValue(
      buildNutricionista(null),
    );

    const result = await useCase.execute({ nutricionistaId: 1 });

    expect(result).toEqual({ preferencias: '' });
  });

  it('lanza NotFoundError cuando el nutricionista no existe', async () => {
    nutricionistaRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ nutricionistaId: 999 })).rejects.toThrow(
      NotFoundError,
    );
  });
});
