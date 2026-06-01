import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsignarGrupoUsuarioUseCase } from './asignar-grupo-usuario.use-case';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('AsignarGrupoUsuarioUseCase', () => {
  let useCase: AsignarGrupoUsuarioUseCase;
  let usuarioGrupoRepo: jest.Mocked<Repository<UsuarioGrupoPermisoOrmEntity>>;
  let usuarioRepo: jest.Mocked<Repository<UsuarioOrmEntity>>;
  let grupoRepo: jest.Mocked<Repository<GrupoPermisoOrmEntity>>;

  const mockUsuario = { idUsuario: 1, email: 'test@test.com', rol: 'ADMIN' } as UsuarioOrmEntity;
  const mockGrupo = { id: 1, clave: 'ADMIN', nombre: 'Administrador' } as GrupoPermisoOrmEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsignarGrupoUsuarioUseCase,
        {
          provide: getRepositoryToken(UsuarioGrupoPermisoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UsuarioOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GrupoPermisoOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<AsignarGrupoUsuarioUseCase>(AsignarGrupoUsuarioUseCase);
    usuarioGrupoRepo = module.get(getRepositoryToken(UsuarioGrupoPermisoOrmEntity));
    usuarioRepo = module.get(getRepositoryToken(UsuarioOrmEntity));
    grupoRepo = module.get(getRepositoryToken(GrupoPermisoOrmEntity));
  });

  it('debe asignar grupo a usuario exitosamente', async () => {
    jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario);
    jest.spyOn(grupoRepo, 'findOne').mockResolvedValue(mockGrupo);
    jest.spyOn(usuarioGrupoRepo, 'findOne').mockResolvedValue(null);
    jest.spyOn(usuarioGrupoRepo, 'create').mockReturnValue({ id: 1, usuario: mockUsuario, grupoPermiso: mockGrupo, fechaAsignacion: new Date() });
    jest.spyOn(usuarioGrupoRepo, 'save').mockResolvedValue({ id: 1, usuario: mockUsuario, grupoPermiso: mockGrupo, fechaAsignacion: new Date() });

    const result = await useCase.execute({ usuarioId: 1, grupoPermisoId: 1 });

    expect(result.id).toBe(1);
    expect(usuarioGrupoRepo.create).toHaveBeenCalledWith({ usuario: mockUsuario, grupoPermiso: mockGrupo });
  });

  it('debe lanzar NotFoundException si usuario no existe', async () => {
    jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute({ usuarioId: 999, grupoPermisoId: 1 })).rejects.toThrow(NotFoundException);
  });

  it('debe lanzar NotFoundException si grupo no existe', async () => {
    jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario);
    jest.spyOn(grupoRepo, 'findOne').mockResolvedValue(null);

    await expect(useCase.execute({ usuarioId: 1, grupoPermisoId: 999 })).rejects.toThrow(NotFoundException);
  });

  it('debe lanzar ConflictException si grupo ya esta asignado', async () => {
    jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario);
    jest.spyOn(grupoRepo, 'findOne').mockResolvedValue(mockGrupo);
    jest.spyOn(usuarioGrupoRepo, 'findOne').mockResolvedValue({ id: 1 } as UsuarioGrupoPermisoOrmEntity);

    await expect(useCase.execute({ usuarioId: 1, grupoPermisoId: 1 })).rejects.toThrow(ConflictException);
  });
});