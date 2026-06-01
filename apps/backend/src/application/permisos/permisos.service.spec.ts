import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermisosService } from './permisos.service';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';

describe('PermisosService', () => {
  let service: PermisosService;
  let usuarioGrupoRepo: jest.Mocked<Repository<UsuarioGrupoPermisoOrmEntity>>;
  let grupoRepo: jest.Mocked<Repository<GrupoPermisoOrmEntity>>;

  const mockAccion = (clave: string): AccionOrmEntity => ({
    id: Math.random(),
    clave,
    nombre: '',
    descripcion: null,
    grupos: [],
    usuarios: [],
  });

  const mockGrupo = (
    clave: string,
    acciones: AccionOrmEntity[],
  ): GrupoPermisoOrmEntity => ({
    id: Math.random(),
    clave,
    nombre: '',
    descripcion: null,
    acciones,
    usuariosGruposPermisos: [],
    hijos: [],
  });

  const mockUsuarioGrupoPermiso = (
    id: number,
    grupo: GrupoPermisoOrmEntity,
    gimnasioId: number | null = null,
  ) => ({
    id,
    usuario: null as any,
    grupoPermiso: grupo,
    gimnasioId,
    fechaAsignacion: new Date(),
  });

  const mockCreateQueryBuilder = jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermisosService,
        {
          provide: getRepositoryToken(UsuarioGrupoPermisoOrmEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: mockCreateQueryBuilder,
          },
        },
        {
          provide: getRepositoryToken(AccionOrmEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GrupoPermisoOrmEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UsuarioOrmEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermisosService>(PermisosService);
    usuarioGrupoRepo = module.get(
      getRepositoryToken(UsuarioGrupoPermisoOrmEntity),
    );
    grupoRepo = module.get(getRepositoryToken(GrupoPermisoOrmEntity));
  });

  describe('getUserActions', () => {
    it('debe retornar array vacio cuando usuario no tiene grupos', async () => {
      jest.spyOn(usuarioGrupoRepo, 'find').mockResolvedValue([]);

      const result = await service.getUserActions(1);

      expect(result).toEqual([]);
    });

    it('debe retornar acciones del grupo cuando usuario tiene un grupo', async () => {
      const grupo = mockGrupo('ADMIN', [
        mockAccion('socios.ver'),
        mockAccion('socios.crear'),
      ]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.getUserActions(1);

      expect(result).toContain('socios.ver');
      expect(result).toContain('socios.crear');
      expect(result).toHaveLength(2);
    });

    it('debe retornar union de acciones cuando usuario tiene multiples grupos', async () => {
      const grupo1 = mockGrupo('ADMIN', [
        mockAccion('socios.ver'),
        mockAccion('socios.crear'),
      ]);
      const grupo2 = mockGrupo('RECEPCIONISTA', [
        mockAccion('socios.ver'),
        mockAccion('turnos.ver'),
      ]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([
          mockUsuarioGrupoPermiso(1, grupo1),
          mockUsuarioGrupoPermiso(2, grupo2),
        ]);

      const result = await service.getUserActions(1);

      expect(result).toContain('socios.ver');
      expect(result).toContain('socios.crear');
      expect(result).toContain('turnos.ver');
      expect(result).toHaveLength(3);
    });
  });

  describe('hasAllActions', () => {
    it('debe retornar true cuando usuario tiene todas las acciones requeridas', async () => {
      const grupo = mockGrupo('ADMIN', [
        mockAccion('socios.ver'),
        mockAccion('socios.crear'),
      ]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAllActions(1, [
        'socios.ver',
        'socios.crear',
      ]);

      expect(result).toBe(true);
    });

    it('debe retornar false cuando usuario tiene alguna accion faltante', async () => {
      const grupo = mockGrupo('ADMIN', [mockAccion('socios.ver')]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAllActions(1, [
        'socios.ver',
        'socios.crear',
      ]);

      expect(result).toBe(false);
    });

    it('debe retornar true para array vacio de acciones requeridas', async () => {
      jest.spyOn(usuarioGrupoRepo, 'find').mockResolvedValue([]);

      const result = await service.hasAllActions(1, []);

      expect(result).toBe(true);
    });
  });

  describe('hasAnyAction', () => {
    it('debe retornar true cuando usuario tiene al menos una de las acciones', async () => {
      const grupo = mockGrupo('ADMIN', [mockAccion('socios.ver')]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAnyAction(1, [
        'socios.ver',
        'socios.crear',
      ]);

      expect(result).toBe(true);
    });

    it('debe retornar false cuando usuario no tiene ninguna de las acciones', async () => {
      const grupo = mockGrupo('ADMIN', [mockAccion('turnos.ver')]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAnyAction(1, [
        'socios.ver',
        'socios.crear',
      ]);

      expect(result).toBe(false);
    });

    it('debe retornar true para array vacio de acciones', async () => {
      jest.spyOn(usuarioGrupoRepo, 'find').mockResolvedValue([]);

      const result = await service.hasAnyAction(1, []);

      expect(result).toBe(true);
    });
  });

  describe('getUserGroups', () => {
    it('debe retornar grupos del usuario', async () => {
      const grupo1 = mockGrupo('ADMIN', []);
      const grupo2 = mockGrupo('RECEPCIONISTA', []);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([
          mockUsuarioGrupoPermiso(1, grupo1, null),
          mockUsuarioGrupoPermiso(2, grupo2, null),
        ]);

      const result = await service.getUserGroups(1);

      expect(result).toHaveLength(2);
      expect(result[0].clave).toBe('ADMIN');
      expect(result[1].clave).toBe('RECEPCIONISTA');
    });

    it('debe retornar array vacio cuando usuario no tiene grupos', async () => {
      jest.spyOn(usuarioGrupoRepo, 'find').mockResolvedValue([]);

      const result = await service.getUserGroups(1);

      expect(result).toEqual([]);
    });
  });

  describe('wildcard support in hasAllActions', () => {
    it('debe retornar true cuando usuario tiene wildcard socios.* y requiere socios.crear', async () => {
      const grupo = mockGrupo('RECEPCIONISTA', [
        mockAccion('socios.*'), // wildcard
        mockAccion('turnos.ver'),
      ]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAllActions(1, ['socios.crear']);

      expect(result).toBe(true);
    });

    it('debe retornar true cuando usuario tiene wildcard socios.* y requiere socios.eliminar', async () => {
      const grupo = mockGrupo('RECEPCIONISTA', [
        mockAccion('socios.*'), // wildcard
        mockAccion('turnos.ver'),
      ]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAllActions(1, ['socios.eliminar']);

      expect(result).toBe(true);
    });

    it('debe retornar false cuando usuario solo tiene socios.crear y requiere socios.eliminar', async () => {
      const grupo = mockGrupo('RECEPCIONISTA', [mockAccion('socios.crear')]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAllActions(1, ['socios.eliminar']);

      expect(result).toBe(false);
    });

    it('debe verificar mix de exacta y wildcard', async () => {
      const grupo = mockGrupo('RECEPCIONISTA', [
        mockAccion('socios.*'),
        mockAccion('turnos.ver'),
      ]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAllActions(1, [
        'socios.crear',
        'socios.eliminar',
        'turnos.ver',
      ]);

      expect(result).toBe(true);
    });

    it('debe retornar false cuando falta alguna accion aunque tiene wildcard para otras', async () => {
      const grupo = mockGrupo('RECEPCIONISTA', [
        mockAccion('socios.*'), // cubre socios.crear, socios.eliminar, etc
        mockAccion('turnos.ver'),
      ]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAllActions(1, [
        'socios.crear',
        'nutricionistas.ver', // no tiene esta accion
      ]);

      expect(result).toBe(false);
    });
  });

  describe('wildcard support in hasAnyAction', () => {
    it('debe retornar true cuando usuario tiene wildcard socios.* y requiere socios.crear', async () => {
      const grupo = mockGrupo('RECEPCIONISTA', [
        mockAccion('socios.*'),
        mockAccion('turnos.ver'),
      ]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAnyAction(1, [
        'socios.crear',
        'nutricionistas.ver',
      ]);

      expect(result).toBe(true);
    });

    it('debe retornar false cuando ninguna accion coincide con wildcard', async () => {
      const grupo = mockGrupo('RECEPCIONISTA', [mockAccion('socios.*')]);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo)]);

      const result = await service.hasAnyAction(1, [
        'turnos.ver',
        'nutricionistas.ver',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('per-gimnasio permissions in getUserGroups', () => {
    it('debe retornar grupos con gimnasioId null (aplica a todos)', async () => {
      const grupo = mockGrupo('ADMIN', [mockAccion('socios.ver')]);
      mockCreateQueryBuilder.mockReturnValueOnce({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([mockUsuarioGrupoPermiso(1, grupo, null)]),
      });

      const result = await service.getUserGroups(1, 5);

      expect(result).toHaveLength(1);
      expect(result[0].clave).toBe('ADMIN');
    });

    it('debe retornar grupos con gimnasioId especifico que coincide', async () => {
      const grupo1 = mockGrupo('ADMIN', [mockAccion('socios.ver')]);
      const grupo2 = mockGrupo('NUTRICIONISTA', [mockAccion('turnos.ver')]);
      mockCreateQueryBuilder.mockReturnValueOnce({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            mockUsuarioGrupoPermiso(1, grupo1, 5),
            mockUsuarioGrupoPermiso(2, grupo2, null),
          ]),
      });

      const result = await service.getUserGroups(1, 5);

      expect(result).toHaveLength(2);
    });

    it('debe retornar array vacio cuando no hay grupos para ese gimnasio', async () => {
      mockCreateQueryBuilder.mockReturnValueOnce({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getUserGroups(1, 99);

      expect(result).toEqual([]);
    });

    it('debe retornar grupos sin filtro cuando gimnasioId es undefined', async () => {
      const grupo1 = mockGrupo('ADMIN', []);
      const grupo2 = mockGrupo('RECEPCIONISTA', []);
      jest
        .spyOn(usuarioGrupoRepo, 'find')
        .mockResolvedValue([
          mockUsuarioGrupoPermiso(1, grupo1, 1),
          mockUsuarioGrupoPermiso(2, grupo2, 2),
        ]);

      const result = await service.getUserGroups(1);

      expect(result).toHaveLength(2);
    });
  });
});
