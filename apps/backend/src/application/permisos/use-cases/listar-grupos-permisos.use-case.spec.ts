import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListarGruposPermisosUseCase } from './listar-grupos-permisos.use-case';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';

describe('ListarGruposPermisosUseCase', () => {
  let useCase: ListarGruposPermisosUseCase;
  let grupoRepo: jest.Mocked<Repository<GrupoPermisoOrmEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarGruposPermisosUseCase,
        {
          provide: getRepositoryToken(GrupoPermisoOrmEntity),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ListarGruposPermisosUseCase>(ListarGruposPermisosUseCase);
    grupoRepo = module.get(getRepositoryToken(GrupoPermisoOrmEntity));
  });

  it('debe listar todos los grupos de permisos', async () => {
    const mockGrupos = [
      {
        id: 1,
        clave: 'ADMIN',
        nombre: 'Administrador',
        descripcion: 'Admin',
        acciones: [{ id: 1, clave: 'socios.ver', nombre: '', descripcion: null, grupos: [], usuarios: [] }],
        usuariosGruposPermisos: [],
        hijos: [],
      },
      {
        id: 2,
        clave: 'RECEPCIONISTA',
        nombre: 'Recepcionista',
        descripcion: 'Recep',
        acciones: [{ id: 2, clave: 'turnos.ver', nombre: '', descripcion: null, grupos: [], usuarios: [] }],
        usuariosGruposPermisos: [],
        hijos: [],
      },
    ] as unknown as GrupoPermisoOrmEntity[];

    jest.spyOn(grupoRepo, 'find').mockResolvedValue(mockGrupos);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].clave).toBe('ADMIN');
    expect(result[1].clave).toBe('RECEPCIONISTA');
  });

  it('debe retornar array vacio si no hay grupos', async () => {
    jest.spyOn(grupoRepo, 'find').mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});