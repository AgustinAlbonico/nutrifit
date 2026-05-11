import { ExecutionContext } from '@nestjs/common';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { NutricionistaOwnershipGuard } from './nutricionista-ownership.guard';

describe('NutricionistaOwnershipGuard', () => {
  let guard: NutricionistaOwnershipGuard;
  let findPersonaIdByUserId: jest.Mock;
  let usuarioRepository: jest.Mocked<UsuarioRepository>;

  beforeEach(() => {
    findPersonaIdByUserId = jest.fn();

    usuarioRepository = {
      findPersonaIdByUserId,
    } as unknown as jest.Mocked<UsuarioRepository>;

    guard = new NutricionistaOwnershipGuard(usuarioRepository);
  });

  it('permite bypass de admin', async () => {
    const request = createRequest({
      user: { id: 1, rol: Rol.ADMIN },
      params: { nutricionistaId: '25' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(findPersonaIdByUserId).not.toHaveBeenCalled();
  });

  it('permite al nutricionista operar sobre sí mismo', async () => {
    findPersonaIdByUserId.mockResolvedValue(25);
    const request = createRequest({
      user: { id: 2, rol: Rol.NUTRICIONISTA },
      params: { nutricionistaId: '25' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it('rechaza operar sobre otro profesional', async () => {
    findPersonaIdByUserId.mockResolvedValue(25);
    const request = createRequest({
      user: { id: 2, rol: Rol.NUTRICIONISTA },
      params: { nutricionistaId: '40' },
    });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'No tenes permisos para operar sobre otro profesional.',
    );
  });
});

interface RequestStub {
  params: Record<string, string>;
  user?: {
    id: number;
    rol: Rol;
  };
}

function createContext(request: RequestStub): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function createRequest(overrides: Partial<RequestStub>): RequestStub {
  return {
    params: {},
    ...overrides,
  };
}
