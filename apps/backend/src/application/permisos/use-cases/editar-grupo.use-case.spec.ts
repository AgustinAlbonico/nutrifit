import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EditarGrupoUseCase } from './editar-grupo.use-case';

describe('EditarGrupoUseCase', () => {
  const buildUseCase = (grupoRepoMock: any) =>
    new EditarGrupoUseCase(grupoRepoMock);

  const grupoCustom = {
    id: 1,
    clave: 'CUSTOM',
    nombre: 'Custom',
    descripcion: null,
    esGrupoSistema: false,
    acciones: [],
    usuariosGruposPermisos: [],
    hijos: [],
  };

  const grupoSistema = {
    id: 2,
    clave: 'ADMIN',
    nombre: 'Admin',
    descripcion: null,
    esGrupoSistema: true,
    acciones: [],
    usuariosGruposPermisos: [],
    hijos: [],
  };

  it('ADMIN puede editar grupo custom', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(grupoCustom),
      save: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await useCase.execute({ id: 1, rol: 'ADMIN' }, 1, { nombre: 'Nuevo' });
    expect(repo.save).toHaveBeenCalled();
  });

  it('ADMIN NO puede editar grupo del sistema → ForbiddenException', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(grupoSistema),
      save: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await expect(
      useCase.execute({ id: 1, rol: 'ADMIN' }, 2, { nombre: 'X' }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('SUPERADMIN puede editar grupo del sistema', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(grupoSistema),
      save: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await useCase.execute({ id: 1, rol: 'SUPERADMIN' }, 2, { nombre: 'Nuevo' });
    expect(repo.save).toHaveBeenCalled();
  });

  it('NUTRICIONISTA NO puede editar ningún grupo → ForbiddenException', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(grupoCustom),
      save: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await expect(
      useCase.execute({ id: 1, rol: 'NUTRICIONISTA' }, 1, { nombre: 'X' }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si el grupo no existe', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const useCase = buildUseCase(repo);
    await expect(
      useCase.execute({ id: 1, rol: 'ADMIN' }, 999, { nombre: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});
