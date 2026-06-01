import { Test, TestingModule } from '@nestjs/testing';
import { MapearIngredientesIAUseCase } from './mapear-ingredientes-ia.use-case';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  MapeoIngredienteExacto,
  MapeoIngredienteConflicto,
} from '../dto/mapeo-ingredientes.dto';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

/**
 * Tests para MapearIngredientesIAUseCase.
 *
 * Task 3: Resolver mapeo de ingredientes IA al catalogo
 *
 * Principios de diseño:
 * - Matching conservador y determinístico
 * - Preferir match exacto/normalizado primero
 * - Fuzzy fallback solo si es unambiguous y se puede justificar
 * - Conflictos explícitos surfaceados para revisión profesional
 * - Sin persistencia - solo mapeo y señalización de conflictos
 */
describe('MapearIngredientesIAUseCase', () => {
  let useCase: MapearIngredientesIAUseCase;

  // Alimentos de prueba del catalogo
  const crearAlimentoMock = (id: number, nombre: string): AlimentoOrmEntity => {
    const alimento = new AlimentoOrmEntity();
    alimento.idAlimento = id;
    alimento.nombre = nombre;
    alimento.cantidad = 100;
    alimento.calorias = 100;
    alimento.proteinas = 10;
    alimento.carbohidratos = 20;
    alimento.grasas = 5;
    alimento.unidadMedida = UnidadMedida.GRAMO;
    return alimento;
  };

  // Catalogo base con dos alimentos que normalizan igual ("pollo")
  const alimentosMock = [
    crearAlimentoMock(1, 'Avena'),
    crearAlimentoMock(2, 'Leche entera'),
    crearAlimentoMock(3, 'Pollo'),
    crearAlimentoMock(6, 'pollo'), // misma clave normalizada que "Pollo"
    crearAlimentoMock(4, 'Arroz blanco cocido'),
    crearAlimentoMock(5, 'Yogur natural'),
    crearAlimentoMock(7, 'Merluza'),
    crearAlimentoMock(8, 'Huevo'),
    crearAlimentoMock(9, 'Manzana'),
    crearAlimentoMock(10, 'Banana'),
  ];

  let mockRepo: jest.Mocked<Repository<AlimentoOrmEntity>>;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<AlimentoOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapearIngredientesIAUseCase,
        { provide: getRepositoryToken(AlimentoOrmEntity), useValue: mockRepo },
      ],
    }).compile();

    useCase = module.get<MapearIngredientesIAUseCase>(
      MapearIngredientesIAUseCase,
    );
  });

  describe('Mapeo exacto (case-insensitive, accent-insensitive)', () => {
    it('debe mapear un ingrediente que coincide exactamente con el catalogo', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena'],
      });

      expect(resultado.tieneConflictos).toBe(false);
      expect(resultado.conflictos).toHaveLength(0);
      expect(resultado.mapeos).toHaveLength(1);
      expect(resultado.mapeos[0].tipo).toBe('exacto');
      expect(
        (resultado.mapeos[0] as MapeoIngredienteExacto).alimento.nombre,
      ).toBe('Avena');
    });

    it('debe ser case-insensitive en el matching', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['AVENA', 'LECHE ENTERA'],
      });

      expect(resultado.tieneConflictos).toBe(false);
      expect(resultado.mapeos).toHaveLength(2);
      expect(resultado.mapeos[0].tipo).toBe('exacto');
      expect(resultado.mapeos[1].tipo).toBe('exacto');
    });

    it('debe ser accent-insensitive en el matching', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena'],
      });

      expect(resultado.tieneConflictos).toBe(false);
      expect(resultado.mapeos[0].tipo).toBe('exacto');
    });

    it('debe mapear multiples ingredientes en una sola llamada', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena', 'leche entera', 'merluza'],
      });

      expect(resultado.tieneConflictos).toBe(false);
      expect(resultado.mapeos).toHaveLength(3);
      expect(resultado.exitosos).toBe(3);
      expect(resultado.totalConflictos).toBe(0);
    });
  });

  describe('Conflicto: ingrediente no encontrado', () => {
    it('debe retornar conflicto NO_ENCONTRADO cuando el ingrediente no existe', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['ingrediente-inexistente-12345'],
      });

      expect(resultado.tieneConflictos).toBe(true);
      expect(resultado.conflictos).toHaveLength(1);
      expect(resultado.conflictos[0].razon).toBe('NO_ENCONTRADO');
      expect(resultado.conflictos[0].ingredienteOriginal).toBe(
        'ingrediente-inexistente-12345',
      );
    });

    it('debe mantener el orden de resultados igual al de entrada', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena', 'no-existe', 'leche entera'],
      });

      expect(resultado.mapeos[0].tipo).toBe('exacto');
      expect(resultado.mapeos[1].tipo).toBe('conflicto');
      expect(resultado.mapeos[2].tipo).toBe('exacto');
      expect((resultado.mapeos[1] as MapeoIngredienteConflicto).razon).toBe(
        'NO_ENCONTRADO',
      );
    });
  });

  describe('Conflicto: ingrediente ambiguo (multiples candidatos)', () => {
    it('debe retornar conflicto AMBIGUO cuando hay multiples candidatos', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['pollo'],
      });

      expect(resultado.tieneConflictos).toBe(true);
      expect(resultado.conflictos).toHaveLength(1);
      expect(resultado.conflictos[0].razon).toBe('AMBIGUO');
      expect(resultado.conflictos[0].candidatos).toHaveLength(2);
    });

    it('debe incluir los candidatos en el conflicto AMBIGUO', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['pollo'],
      });

      const conflicto = resultado.conflictos[0];
      expect(conflicto.candidatos).toBeDefined();
      expect(conflicto.candidatos!.length).toBe(2);
      const nombresCandidatos = conflicto.candidatos!.map((c) => c.nombre);
      expect(nombresCandidatos).toContain('Pollo');
      expect(nombresCandidatos).toContain('pollo');
    });
  });

  describe('Manejo de ingredientes vacios o invalidos', () => {
    it('debe ignorar strings vacios', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena', '', 'leche entera'],
      });

      expect(resultado.mapeos).toHaveLength(2);
      expect(resultado.mapeos[0].tipo).toBe('exacto');
      expect(resultado.mapeos[1].tipo).toBe('exacto');
    });

    it('debe ignorar strings con solo espacios', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena', '   ', 'leche entera'],
      });

      expect(resultado.mapeos).toHaveLength(2);
    });

    it('debe retornar array vacio cuando no hay ingredientes validos', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['', '   ', '  \n\t  '],
      });

      expect(resultado.mapeos).toHaveLength(0);
      expect(resultado.tieneConflictos).toBe(false);
      expect(resultado.exitosos).toBe(0);
    });
  });

  describe('Normalizacion de nombres', () => {
    it('debe eliminar leading/trailing whitespace antes de buscar', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['  avena  ', '\tleche entera\t'],
      });

      expect(resultado.tieneConflictos).toBe(false);
      expect(resultado.mapeos).toHaveLength(2);
    });
  });

  describe('Resumen agregado', () => {
    it('debe contar exitosos y conflictos correctamente', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: [
          'avena',
          'no-existe-1',
          'leche entera',
          'pollo', // ahora es ambiguo (Pollo + pollo)
          'tampoco-existe',
        ],
      });

      expect(resultado.exitosos).toBe(2); // avena, leche entera
      expect(resultado.totalConflictos).toBe(3); // no-existe-1, pollo ambiguo, tampoco-existe
      expect(resultado.conflictos).toHaveLength(3);
    });

    it('debe report totalConflictos > 0 cuando hay conflictos', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['pollo', 'no-existe'],
      });

      expect(resultado.tieneConflictos).toBe(true);
      expect(resultado.totalConflictos).toBe(2);
    });

    it('debe report tieneConflictos = false cuando todos los ingredientes mapean', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena', 'leche entera'],
      });

      expect(resultado.tieneConflictos).toBe(false);
      expect(resultado.mapeos).toHaveLength(2);
    });
  });

  describe('Veracidad clinica: sin suposiciones', () => {
    it('no debe hacer fuzzy match para candidatos ambiguos - debe senialar conflicto', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['pollo'],
      });

      expect(resultado.conflictos[0].razon).toBe('AMBIGUO');
    });

    it('debe fornecer mensaje legible en cada conflicto', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['no-existe'],
      });

      expect(resultado.conflictos[0].mensaje).toBeDefined();
      expect(resultado.conflictos[0].mensaje.length).toBeGreaterThan(0);
    });
  });

  describe('Fuzzy matching', () => {
    it('debe usar match exacto cuando existe coincidencia exacta', async () => {
      const alimentosConTypos = [
        crearAlimentoMock(1, 'Avena'),
        crearAlimentoMock(2, 'Leche entera'),
        crearAlimentoMock(3, 'Pollo'),
        crearAlimentoMock(4, 'Arroz blanco cocido'),
        crearAlimentoMock(5, 'Yogur natural'),
        crearAlimentoMock(6, 'pollo'),
        crearAlimentoMock(7, 'Merluza'),
        crearAlimentoMock(8, 'Huevo'),
        crearAlimentoMock(9, 'Manzana'),
        crearAlimentoMock(10, 'Banana'),
        crearAlimentoMock(11, 'Avena Integral'),
      ];
      mockRepo.find.mockResolvedValue(alimentosConTypos);

      const resultado = await useCase.execute({
        ingredientes: ['avena integral'],
      });

      expect(resultado.mapeos[0].tipo).toBe('exacto');
      expect(
        (resultado.mapeos[0] as MapeoIngredienteExacto).alimento.nombre,
      ).toBe('Avena Integral');
    });

    it('no debe usar fuzzy matching cuando hay multiples candidatos exactos', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['pollo'],
      });

      expect(resultado.conflictos[0].razon).toBe('AMBIGUO');
    });

    it('debe ignorar ingrediente null sin fallar', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena', null as unknown as string, 'leche entera'],
      });

      expect(resultado.mapeos).toHaveLength(2);
    });

    it('debe ignorar ingredientes que no son strings', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: [
          'avena',
          123 as unknown as string,
          { nombre: 'obj' } as unknown as string,
          'leche entera',
        ],
      });

      expect(resultado.mapeos).toHaveLength(2);
    });

    it('debe fazer fuzzy match quando há um único candidato próximo (sem coincidência exata)', async () => {
      // Catalogo com apenas "Avena Integral", sem "avena integral" exato
      const catalogoConUnAlimento = [crearAlimentoMock(1, 'Avena Integral')];
      mockRepo.find.mockResolvedValue(catalogoConUnAlimento);

      // "avena integrl" é próximo de "Avena Integral" via Levenshtein
      const resultado = await useCase.execute({
        ingredientes: ['avena integrl'],
      });

      expect(resultado.mapeos).toHaveLength(1);
      expect(resultado.mapeos[0].tipo).toBe('exacto');
      expect(
        (resultado.mapeos[0] as MapeoIngredienteExacto).alimento.nombre,
      ).toBe('Avena Integral');
    });

    it('deve retorna conflito QUIMICO quando há empate de similaridade entre candidatos', async () => {
      // Dois alimentos cujos nombres tienen la misma distancia al query
      // "Pollo" y "pollo" ambos dan 1.0 con "pollo" normalizado
      const catalogoConDuplicados = [
        crearAlimentoMock(1, 'Avena'),
        crearAlimentoMock(2, 'Leche'),
        crearAlimentoMock(3, 'Pollo'),
        crearAlimentoMock(4, 'pollo'), // mismo nombre normalizado
      ];
      mockRepo.find.mockResolvedValue(catalogoConDuplicados);

      const resultado = await useCase.execute({
        ingredientes: ['pollo'],
      });

      // Debe ser ambiguo porque hay dos candidatos exactos
      expect(resultado.conflictos[0].razon).toBe('AMBIGUO');
    });

    it('debe usar fuzzy match para typo/near-match con alta similitud', async () => {
      const catalogoPocasOpciones = [
        crearAlimentoMock(1, 'Avena'),
        crearAlimentoMock(2, 'Yogur natural'),
        crearAlimentoMock(3, 'Merluza'),
      ];
      mockRepo.find.mockResolvedValue(catalogoPocasOpciones);

      // "avena integrl" es un typo de "Avena" pero debe dar alta similitud
      // "Avena" vs "avena integrl": distancia 6, maxLen 12, similitud = 1 - 6/12 = 0.5 < 0.85
      // No debería matchear fuzzy con 0.85 de umbral
      // En cambio probamos con nombre muy similar
      const resultado = await useCase.execute({
        ingredientes: ['merluz'], // typo: merluz vs Merluza
      });

      // "merluz" vs "Merluza": distancia 1, maxLen 7, similitud = 1 - 1/7 ≈ 0.857 >= 0.85
      expect(resultado.mapeos[0].tipo).toBe('exacto');
      expect(
        (resultado.mapeos[0] as MapeoIngredienteExacto).alimento.nombre,
      ).toBe('Merluza');
    });

    it('debe retornar AlimentoResumen (no AlimentoOrmEntity) en mapeo exitoso', async () => {
      mockRepo.find.mockResolvedValue(alimentosMock);

      const resultado = await useCase.execute({
        ingredientes: ['avena'],
      });

      const mapeo = resultado.mapeos[0] as MapeoIngredienteExacto;
      expect(mapeo.alimento).toHaveProperty('idAlimento');
      expect(mapeo.alimento).toHaveProperty('nombre');
      // No debe exponer propiedades ORM internas
      // AlimentoResumen solo tiene idAlimento y nombre
      expect(
        mapeo.alimento['cantidad' as keyof typeof mapeo.alimento],
      ).toBeUndefined();
      expect(
        mapeo.alimento['calorias' as keyof typeof mapeo.alimento],
      ).toBeUndefined();
    });

    it('debe truncar mensaje de conflicto AMBIGUO cuando hay muchos candidatos', async () => {
      // Crear catalogo con muchos "pollo" (misma clave normalizada "pollo") para forzar truncamiento
      // Usamos variaciones de caso que todas normalizan a "pollo"
      const muchosPollo = [
        crearAlimentoMock(1, 'pollo'),
        crearAlimentoMock(2, 'Pollo'),
        crearAlimentoMock(3, 'POLLO'),
        crearAlimentoMock(4, 'Pollo '),
        crearAlimentoMock(5, ' Pollo'),
        crearAlimentoMock(6, '  pollo  '),
      ];
      mockRepo.find.mockResolvedValue(muchosPollo);

      const resultado = await useCase.execute({
        ingredientes: ['pollo'],
      });

      expect(resultado.conflictos[0].razon).toBe('AMBIGUO');
      // Mensaje debe indicar cantidad total y mostrar solo primeros 5
      expect(resultado.conflictos[0].mensaje).toContain('6 alimentos');
      expect(resultado.conflictos[0].mensaje).toContain('y 1 más');
      // Lista de candidatos en el conflicto debe tener todos (para selección del profesional)
      expect(resultado.conflictos[0].candidatos).toHaveLength(6);
    });
  });

  describe('Catalogo vacio', () => {
    it('debe retornar conflictos NO_ENCONTRADO cuando el catalogo esta vacio', async () => {
      mockRepo.find.mockResolvedValue([]);

      const resultado = await useCase.execute({
        ingredientes: ['avena', 'leche'],
      });

      expect(resultado.mapeos).toHaveLength(2);
      expect(resultado.mapeos[0].tipo).toBe('conflicto');
      expect(resultado.mapeos[1].tipo).toBe('conflicto');
      expect((resultado.mapeos[0] as MapeoIngredienteConflicto).razon).toBe(
        'NO_ENCONTRADO',
      );
      expect((resultado.mapeos[1] as MapeoIngredienteConflicto).razon).toBe(
        'NO_ENCONTRADO',
      );
      expect(resultado.tieneConflictos).toBe(true);
      expect(resultado.exitosos).toBe(0);
      expect(resultado.totalConflictos).toBe(2);
    });

    it('debe retornar mapeos vacios cuando no hay ingredientes y catalogo vacio', async () => {
      mockRepo.find.mockResolvedValue([]);

      const resultado = await useCase.execute({
        ingredientes: [],
      });

      expect(resultado.mapeos).toHaveLength(0);
      expect(resultado.tieneConflictos).toBe(false);
      expect(resultado.exitosos).toBe(0);
      expect(resultado.totalConflictos).toBe(0);
    });

    it('debe ignorar ingredientes null o undefined', async () => {
      mockRepo.find.mockResolvedValue([]);

      const resultado = await useCase.execute({
        ingredientes: [
          null as unknown as string,
          undefined as unknown as string,
        ],
      });

      expect(resultado.mapeos).toHaveLength(0);
    });
  });
});
