import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListarAccionesUseCase } from './listar-acciones.use-case';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';

describe('ListarAccionesUseCase', () => {
  let useCase: ListarAccionesUseCase;
  let accionRepo: jest.Mocked<Repository<AccionOrmEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarAccionesUseCase,
        {
          provide: getRepositoryToken(AccionOrmEntity),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ListarAccionesUseCase>(ListarAccionesUseCase);
    accionRepo = module.get(getRepositoryToken(AccionOrmEntity));
  });

  it('debe listar todas las acciones', async () => {
    const mockAcciones = [
      { id: 1, clave: 'socios.crear', nombre: 'Crear Socios', descripcion: null },
      { id: 2, clave: 'socios.ver', nombre: 'Ver Socios', descripcion: null },
    ] as AccionOrmEntity[];

    jest.spyOn(accionRepo, 'find').mockResolvedValue(mockAcciones);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].clave).toBe('socios.crear');
    expect(result[1].clave).toBe('socios.ver');
  });

  it('debe retornar array vacio si no hay acciones', async () => {
    jest.spyOn(accionRepo, 'find').mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});