import { ConflictException } from '@nestjs/common';
import { CrearGrupoUseCase } from './crear-grupo.use-case';

describe('CrearGrupoUseCase', () => {
  const buildUseCase = (grupoRepoMock: any) => {
    return new CrearGrupoUseCase(grupoRepoMock);
  };

  it('fuerza esGrupoSistema=false siempre', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockReturnValue({ id: 42, clave: 'CUSTOM', nombre: 'Custom' }),
      save: jest
        .fn()
        .mockResolvedValue({ id: 42, clave: 'CUSTOM', nombre: 'Custom' }),
    };
    const useCase = buildUseCase(grupoRepo);

    await useCase.execute(
      { id: 1, rol: 'ADMIN' },
      { clave: 'CUSTOM', nombre: 'Custom', descripcion: 'x' },
    );

    expect(grupoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ esGrupoSistema: false }),
    );
  });

  it('permite crear a SUPERADMIN', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({ id: 1, clave: 'X', nombre: 'X' }),
      save: jest.fn().mockResolvedValue({ id: 1, clave: 'X', nombre: 'X' }),
    };
    const useCase = buildUseCase(grupoRepo);
    await expect(
      useCase.execute(
        { id: 1, rol: 'SUPERADMIN' },
        { clave: 'X', nombre: 'X' },
      ),
    ).resolves.toBeDefined();
  });

  it('permite crear a ADMIN', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({ id: 1, clave: 'X', nombre: 'X' }),
      save: jest.fn().mockResolvedValue({ id: 1, clave: 'X', nombre: 'X' }),
    };
    const useCase = buildUseCase(grupoRepo);
    await expect(
      useCase.execute({ id: 1, rol: 'ADMIN' }, { clave: 'X', nombre: 'X' }),
    ).resolves.toBeDefined();
  });

  it('rechaza a NUTRICIONISTA', async () => {
    const grupoRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const useCase = buildUseCase(grupoRepo);
    await expect(
      useCase.execute(
        { id: 1, rol: 'NUTRICIONISTA' },
        { clave: 'X', nombre: 'X' },
      ),
    ).rejects.toThrow();
  });

  it('rechaza a SOCIO', async () => {
    const grupoRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const useCase = buildUseCase(grupoRepo);
    await expect(
      useCase.execute({ id: 1, rol: 'SOCIO' }, { clave: 'X', nombre: 'X' }),
    ).rejects.toThrow();
  });

  it('lanza ConflictException si el grupo ya existe', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 1, clave: 'EXISTING' }),
    };
    const useCase = buildUseCase(grupoRepo);
    await expect(
      useCase.execute(
        { id: 1, rol: 'ADMIN' },
        { clave: 'EXISTING', nombre: 'Existing' },
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('retorna id, clave y nombre del grupo creado', async () => {
    const grupoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockReturnValue({ id: 5, clave: 'NEW', nombre: 'New Group' }),
      save: jest
        .fn()
        .mockResolvedValue({ id: 5, clave: 'NEW', nombre: 'New Group' }),
    };
    const useCase = buildUseCase(grupoRepo);
    const result = await useCase.execute(
      { id: 1, rol: 'ADMIN' },
      { clave: 'NEW', nombre: 'New Group' },
    );
    expect(result).toEqual({ id: 5, clave: 'NEW', nombre: 'New Group' });
  });
});
