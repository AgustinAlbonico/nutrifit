import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObtenerPermisosUsuarioUseCase } from './obtener-permisos-usuario.use-case';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { NotFoundException } from '@nestjs/common';

describe('ObtenerPermisosUsuarioUseCase', () => {
  let useCase: ObtenerPermisosUsuarioUseCase;
  let usuarioRepo: jest.Mocked<Repository<UsuarioOrmEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObtenerPermisosUsuarioUseCase,
        {
          provide: getRepositoryToken(UsuarioOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GrupoPermisoOrmEntity),
          useValue: {},
        },
      ],
    }).compile();

    useCase = module.get<ObtenerPermisosUsuarioUseCase>(
      ObtenerPermisosUsuarioUseCase,
    );
    usuarioRepo = module.get(getRepositoryToken(UsuarioOrmEntity));
  });

  it('debe retornar permisos de usuario exitosamente', async () => {
    const mockUsuario = {
      idUsuario: 1,
      email: 'test@test.com',
      rol: 'ADMIN',
      usuariosGruposPermisos: [
        {
          id: 1,
          grupoPermiso: {
            id: 1,
            clave: 'ADMIN',
            nombre: 'Administrador',
            descripcion: 'Admin',
            acciones: [
              {
                id: 1,
                clave: 'socios.ver',
                nombre: '',
                descripcion: null,
                grupos: [],
                usuarios: [],
              },
            ],
          },
          usuario: null as any,
          fechaAsignacion: new Date(),
        },
      ],
      acciones: [],
    } as unknown as UsuarioOrmEntity;

    jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario);

    const result = await useCase.execute(1);

    expect(result.usuarioId).toBe(1);
    expect(result.email).toBe('test@test.com');
    expect(result.grupos).toHaveLength(1);
    expect(result.grupos[0].clave).toBe('ADMIN');
    expect(result.acciones).toContain('socios.ver');
  });

  it('debe lanzar NotFoundException si usuario no existe', async () => {
    jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
  });
});
