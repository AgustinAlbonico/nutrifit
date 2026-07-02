import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResolvedorCatalogoIA } from './resolvedor-catalogo-ia.service';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

describe('ResolvedorCatalogoIA', () => {
  let service: ResolvedorCatalogoIA;
  let mockAlimentoRepo: Partial<Repository<AlimentoOrmEntity>>;
  let mockGrupoRepo: Partial<Repository<GrupoAlimenticioOrmEntity>>;

  const catalogoExistente = [
    { idAlimento: 1, nombre: 'Pollo' },
    { idAlimento: 2, nombre: 'Arroz blanco' },
    { idAlimento: 3, nombre: 'Banana' },
    { idAlimento: 4, nombre: 'Leche' },
  ];

  const categoriasExistentes = [
    { idGrupoAlimenticio: 1, descripcion: 'Carnes y aves' },
    { idGrupoAlimenticio: 2, descripcion: 'Cereales y tubérculos' },
    { idGrupoAlimenticio: 3, descripcion: 'Frutas' },
    { idGrupoAlimenticio: 4, descripcion: 'Lácteos' },
  ];

  beforeEach(async () => {
    mockAlimentoRepo = {
      save: jest.fn().mockImplementation((entity: AlimentoOrmEntity) => ({
        ...entity,
        idAlimento: 99,
      })),
    };
    mockGrupoRepo = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResolvedorCatalogoIA,
        {
          provide: getRepositoryToken(AlimentoOrmEntity),
          useValue: mockAlimentoRepo,
        },
        {
          provide: getRepositoryToken(GrupoAlimenticioOrmEntity),
          useValue: mockGrupoRepo,
        },
      ],
    }).compile();

    service = module.get<ResolvedorCatalogoIA>(ResolvedorCatalogoIA);
  });

  describe('resolver', () => {
    it('debe resolver alimento existente por nombre exacto', async () => {
      const resultado = await service.resolver(
        ['Pollo'],
        [],
        catalogoExistente,
        categoriasExistentes,
      );
      expect(resultado.mapa.get('Pollo')).toBe(1);
    });

    it('debe resolver por nombre singularizado (s)', async () => {
      const resultado = await service.resolver(
        ['Pollos'],
        [],
        catalogoExistente,
        categoriasExistentes,
      );
      expect(resultado.mapa.get('Pollos')).toBe(1);
    });

    it('debe resolver banana aunque la IA diga platano (sinónimo)', async () => {
      const resultado = await service.resolver(
        ['Platanos'],
        [],
        catalogoExistente,
        categoriasExistentes,
      );
      expect(resultado.mapa.get('Platanos')).toBe(3);
    });

    it('debe crear alimento nuevo si no existe y está declarado en alimentosNuevos', async () => {
      const alimentosNuevos = [
        {
          nombre: 'Quinoa',
          categoriaNombre: 'Cereales y tubérculos',
          cantidadBase: 100,
          unidadBase: 'g',
          calorias: 120,
          proteinas: 4,
          carbohidratos: 21,
          grasas: 2,
        },
      ];

      const resultado = await service.resolver(
        ['Quinoa'],
        alimentosNuevos,
        catalogoExistente,
        categoriasExistentes,
      );
      expect(resultado.mapa.get('Quinoa')).toBeDefined();
      expect(resultado.creados.some((c) => c.nombre === 'Quinoa')).toBe(true);
    });

    it('debe lanzar BadRequestError si alimento no existe ni está declarado', async () => {
      await expect(
        service.resolver(
          ['AlimentoInventado'],
          [],
          catalogoExistente,
          categoriasExistentes,
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it('debe reutilizar alimento existente aunque esté también en alimentosNuevos', async () => {
      const alimentosNuevos = [
        {
          nombre: 'pollo',
          categoriaNombre: 'Carnes y aves',
          cantidadBase: 100,
          unidadBase: 'g',
          calorias: 200,
          proteinas: 30,
          carbohidratos: 0,
          grasas: 10,
        },
      ];

      const resultado = await service.resolver(
        ['Pollo'],
        alimentosNuevos,
        catalogoExistente,
        categoriasExistentes,
      );
      expect(resultado.mapa.get('Pollo')).toBe(1);
      expect(resultado.creados).toHaveLength(0);
    });

    it('debe resolver múltiples alimentos en una llamada', async () => {
      const resultado = await service.resolver(
        ['Pollo', 'Arroz blanco', 'Banana'],
        [],
        catalogoExistente,
        categoriasExistentes,
      );
      expect(resultado.mapa.get('Pollo')).toBe(1);
      expect(resultado.mapa.get('Arroz blanco')).toBe(2);
      expect(resultado.mapa.get('Banana')).toBe(3);
    });
  });
});
