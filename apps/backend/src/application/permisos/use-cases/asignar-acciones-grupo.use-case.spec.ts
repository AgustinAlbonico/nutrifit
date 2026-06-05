import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AsignarAccionesGrupoUseCase } from './asignar-acciones-grupo.use-case';

describe('AsignarAccionesGrupoUseCase', () => {
  const grupoCustom = {
    id: 1,
    clave: 'CUSTOM',
    esGrupoSistema: false,
    acciones: [],
  };
  const grupoSistema = {
    id: 2,
    clave: 'ADMIN',
    esGrupoSistema: true,
    acciones: [],
  };

  const buildUseCase = (grupoRepoMock: any, accionRepoMock: any) =>
    new AsignarAccionesGrupoUseCase(grupoRepoMock, accionRepoMock);

  it('ADMIN puede cambiar acciones de grupo custom', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(grupoCustom),
      save: jest.fn(),
    };
    const accionRepo = {
      find: jest.fn().mockResolvedValue([{ id: 10 }, { id: 20 }]),
    };
    const useCase = buildUseCase(grupoRepo, accionRepo);
    await useCase.execute({ id: 1, rol: 'ADMIN' }, 1, {
      actionIds: [10, 20],
    } as any);
    expect(grupoRepo.save).toHaveBeenCalled();
  });

  it('ADMIN NO puede cambiar acciones de grupo del sistema → ForbiddenException', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(grupoSistema),
      save: jest.fn(),
    };
    const accionRepo = { find: jest.fn() };
    const useCase = buildUseCase(grupoRepo, accionRepo);
    await expect(
      useCase.execute({ id: 1, rol: 'ADMIN' }, 2, { actionIds: [10] } as any),
    ).rejects.toThrow(ForbiddenException);
    expect(grupoRepo.save).not.toHaveBeenCalled();
  });

  it('SUPERADMIN puede cambiar acciones de grupo del sistema', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(grupoSistema),
      save: jest.fn(),
    };
    const accionRepo = { find: jest.fn().mockResolvedValue([{ id: 10 }]) };
    const useCase = buildUseCase(grupoRepo, accionRepo);
    await useCase.execute({ id: 1, rol: 'SUPERADMIN' }, 2, {
      actionIds: [10],
    } as any);
    expect(grupoRepo.save).toHaveBeenCalled();
  });

  it('NUTRICIONISTA no puede cambiar acciones de ningun grupo → ForbiddenException', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(grupoCustom),
      save: jest.fn(),
    };
    const accionRepo = { find: jest.fn() };
    const useCase = buildUseCase(grupoRepo, accionRepo);
    await expect(
      useCase.execute({ id: 1, rol: 'NUTRICIONISTA' }, 1, {
        actionIds: [10],
      } as any),
    ).rejects.toThrow(ForbiddenException);
    expect(grupoRepo.save).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si el grupo no existe', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const accionRepo = { find: jest.fn() };
    const useCase = buildUseCase(grupoRepo, accionRepo);
    await expect(
      useCase.execute({ id: 1, rol: 'ADMIN' }, 999, { actionIds: [10] } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
