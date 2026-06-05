import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EliminarGrupoUseCase } from './eliminar-grupo.use-case';

describe('EliminarGrupoUseCase', () => {
  const buildUseCase = (repoMock: any) => new EliminarGrupoUseCase(repoMock);

  const grupoCustom = {
    id: 1,
    clave: 'CUSTOM',
    esGrupoSistema: false,
    acciones: [],
    usuariosGruposPermisos: [],
    hijos: [],
  };
  const grupoSistema = {
    id: 2,
    clave: 'ADMIN',
    esGrupoSistema: true,
    acciones: [],
    usuariosGruposPermisos: [],
    hijos: [],
  };

  it('ADMIN puede eliminar grupo custom', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(grupoCustom),
      remove: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await useCase.execute({ id: 1, rol: 'ADMIN' }, 1);
    expect(repo.remove).toHaveBeenCalledWith(grupoCustom);
  });

  it('ADMIN NO puede eliminar grupo del sistema → ForbiddenException', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(grupoSistema),
      remove: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await expect(useCase.execute({ id: 1, rol: 'ADMIN' }, 2)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('SUPERADMIN puede eliminar grupo del sistema', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(grupoSistema),
      remove: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await useCase.execute({ id: 1, rol: 'SUPERADMIN' }, 2);
    expect(repo.remove).toHaveBeenCalled();
  });

  it('NUTRICIONISTA no puede eliminar ningún grupo → ForbiddenException', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(grupoCustom),
      remove: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await expect(
      useCase.execute({ id: 1, rol: 'NUTRICIONISTA' }, 1),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si el grupo no existe', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
      remove: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await expect(useCase.execute({ id: 1, rol: 'ADMIN' }, 999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
