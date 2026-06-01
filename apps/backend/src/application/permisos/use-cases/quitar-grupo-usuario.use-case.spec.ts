import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuitarGrupoUsuarioUseCase } from './quitar-grupo-usuario.use-case';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { NotFoundException } from '@nestjs/common';

describe('QuitarGrupoUsuarioUseCase', () => {
  let useCase: QuitarGrupoUsuarioUseCase;
  let usuarioGrupoRepo: jest.Mocked<Repository<UsuarioGrupoPermisoOrmEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuitarGrupoUsuarioUseCase,
        {
          provide: getRepositoryToken(UsuarioGrupoPermisoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<QuitarGrupoUsuarioUseCase>(QuitarGrupoUsuarioUseCase);
    usuarioGrupoRepo = module.get(
      getRepositoryToken(UsuarioGrupoPermisoOrmEntity),
    );
  });

  it('debe quitar grupo de usuario exitosamente', async () => {
    const mockAsignacion = {
      id: 1,
      usuario: null as any,
      grupoPermiso: null as any,
      gimnasioId: null,
      fechaAsignacion: new Date(),
    };
    jest
      .spyOn(usuarioGrupoRepo, 'findOne')
      .mockResolvedValue(mockAsignacion as any);
    jest
      .spyOn(usuarioGrupoRepo, 'remove')
      .mockResolvedValue(mockAsignacion as any);

    await useCase.execute({ usuarioId: 1, grupoPermisoId: 1 });

    expect(usuarioGrupoRepo.remove).toHaveBeenCalledWith(mockAsignacion);
  });

  it('debe lanzar NotFoundException si asignacion no existe', async () => {
    jest.spyOn(usuarioGrupoRepo, 'findOne').mockResolvedValue(null);

    await expect(
      useCase.execute({ usuarioId: 1, grupoPermisoId: 999 }),
    ).rejects.toThrow(NotFoundException);
  });
});
