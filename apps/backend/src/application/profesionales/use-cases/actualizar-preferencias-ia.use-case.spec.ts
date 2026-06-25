import {
  ActualizarPreferenciasIaUseCase,
  MAX_CARACTERES_PREFERENCIAS_IA,
} from './actualizar-preferencias-ia.use-case';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';

describe('ActualizarPreferenciasIaUseCase', () => {
  let useCase: ActualizarPreferenciasIaUseCase;
  let nutricionistaRepository: jest.Mocked<NutricionistaRepository>;
  let auditoriaService: jest.Mocked<AuditoriaService>;

  const buildNutricionista = (
    preferenciasIa: string | null = null,
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
      update: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByEmail: jest.fn(),
      findByDni: jest.fn(),
      findByMatricula: jest.fn(),
    } as unknown as jest.Mocked<NutricionistaRepository>;

    auditoriaService = {
      registrar: jest.fn().mockResolvedValue(undefined),
      listarConFiltros: jest.fn(),
    } as unknown as jest.Mocked<AuditoriaService>;

    useCase = new ActualizarPreferenciasIaUseCase(
      nutricionistaRepository,
      { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any,
      auditoriaService,
    );
  });

  describe('happy path', () => {
    it('persiste texto limpio y devuelve el mismo texto', async () => {
      nutricionistaRepository.findById.mockResolvedValue(
        buildNutricionista(null),
      );
      nutricionistaRepository.update.mockImplementation(
        async (_id, entity) => entity,
      );

      const texto = 'Priorizar proteínas de alto valor biológico';
      const result = await useCase.execute({
        nutricionistaId: 1,
        preferencias: texto,
        usuarioId: 42,
      });

      expect(result.preferencias).toBe(texto);
      expect(nutricionistaRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ preferenciasIa: texto }),
      );
      expect(auditoriaService.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 42,
          accion: 'PREFERENCIAS_IA_EDITADAS',
          entidadId: 1,
        }),
      );
    });

    it('permite guardar string vacío (caso "borrar mis notas")', async () => {
      nutricionistaRepository.findById.mockResolvedValue(
        buildNutricionista('Texto previo'),
      );
      nutricionistaRepository.update.mockImplementation(
        async (_id, entity) => entity,
      );

      const result = await useCase.execute({
        nutricionistaId: 1,
        preferencias: '',
        usuarioId: 42,
      });

      expect(result.preferencias).toBe('');
      expect(nutricionistaRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ preferenciasIa: '' }),
      );
    });
  });

  describe('sanitización', () => {
    it('remueve HTML/scripts antes de persistir', async () => {
      nutricionistaRepository.findById.mockResolvedValue(
        buildNutricionista(null),
      );
      nutricionistaRepository.update.mockImplementation(
        async (_id, entity) => entity,
      );

      const result = await useCase.execute({
        nutricionistaId: 1,
        preferencias: "<script>alert('xss')</script>Pollo",
        usuarioId: 42,
      });

      expect(result.preferencias).toBe("alert('xss')Pollo");
    });

    it('remueve markdown inyectable (backticks, bold)', async () => {
      nutricionistaRepository.findById.mockResolvedValue(
        buildNutricionista(null),
      );
      nutricionistaRepository.update.mockImplementation(
        async (_id, entity) => entity,
      );

      const result = await useCase.execute({
        nutricionistaId: 1,
        preferencias: 'Usar `console.log` para **debug**',
        usuarioId: 42,
      });

      expect(result.preferencias).toBe('Usar console.log para debug');
    });

    it('aplica trim y colapsa saltos de línea múltiples', async () => {
      nutricionistaRepository.findById.mockResolvedValue(
        buildNutricionista(null),
      );
      nutricionistaRepository.update.mockImplementation(
        async (_id, entity) => entity,
      );

      const result = await useCase.execute({
        nutricionistaId: 1,
        preferencias: '   línea 1\n\n\n\nlínea 2   ',
        usuarioId: 42,
      });

      expect(result.preferencias).toBe('línea 1\n\nlínea 2');
    });
  });

  describe('validaciones', () => {
    it('rechaza texto que excede MAX_CARACTERES_PREFERENCIAS_IA con BadRequestError', async () => {
      nutricionistaRepository.findById.mockResolvedValue(
        buildNutricionista(null),
      );

      const textoLargo = 'a'.repeat(MAX_CARACTERES_PREFERENCIAS_IA + 1);

      await expect(
        useCase.execute({
          nutricionistaId: 1,
          preferencias: textoLargo,
          usuarioId: 42,
        }),
      ).rejects.toThrow(BadRequestError);

      expect(nutricionistaRepository.update).not.toHaveBeenCalled();
    });

    it('acepta texto exactamente en el límite', async () => {
      nutricionistaRepository.findById.mockResolvedValue(
        buildNutricionista(null),
      );
      nutricionistaRepository.update.mockImplementation(
        async (_id, entity) => entity,
      );

      const textoLimite = 'a'.repeat(MAX_CARACTERES_PREFERENCIAS_IA);

      const result = await useCase.execute({
        nutricionistaId: 1,
        preferencias: textoLimite,
        usuarioId: 42,
      });

      expect(result.preferencias).toBe(textoLimite);
    });

    it('lanza NotFoundError si el nutricionista no existe', async () => {
      nutricionistaRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          nutricionistaId: 999,
          preferencias: 'texto',
          usuarioId: 42,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(nutricionistaRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('resiliencia de auditoría', () => {
    it('NO falla la operación si la auditoría falla (solo loggea warning)', async () => {
      nutricionistaRepository.findById.mockResolvedValue(
        buildNutricionista(null),
      );
      nutricionistaRepository.update.mockImplementation(
        async (_id, entity) => entity,
      );
      auditoriaService.registrar.mockRejectedValue(new Error('BD caída'));

      const result = await useCase.execute({
        nutricionistaId: 1,
        preferencias: 'Texto válido',
        usuarioId: 42,
      });

      expect(result.preferencias).toBe('Texto válido');
      expect(nutricionistaRepository.update).toHaveBeenCalled();
    });
  });
});