import { ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { TurnoNutricionistaAccessGuard } from './turno-nutricionista-access.guard';

describe('TurnoNutricionistaAccessGuard', () => {
  let guard: TurnoNutricionistaAccessGuard;
  let findPersonaIdByUserId: jest.Mock;
  let findTurno: jest.Mock;
  let usuarioRepository: jest.Mocked<UsuarioRepository>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let tenantContext: jest.Mocked<TenantContextService>;

  beforeEach(() => {
    findPersonaIdByUserId = jest.fn();
    findTurno = jest.fn();

    usuarioRepository = {
      findPersonaIdByUserId,
    } as unknown as jest.Mocked<UsuarioRepository>;

    turnoRepository = {
      findOne: findTurno,
    } as unknown as jest.Mocked<Repository<TurnoOrmEntity>>;

    tenantContext = {
      gimnasioId: 1,
    } as unknown as jest.Mocked<TenantContextService>;

    guard = new TurnoNutricionistaAccessGuard(
      usuarioRepository,
      turnoRepository,
      tenantContext,
    );
  });

  it('permite operar al nutricionista asignado', async () => {
    findPersonaIdByUserId.mockResolvedValue(30);
    findTurno.mockResolvedValue({
      nutricionista: { idPersona: 30 },
    } as TurnoOrmEntity);
    const request = createRequest({
      user: { id: 5, rol: Rol.NUTRICIONISTA },
      params: { id: '8' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.resourceAccess).toEqual({ actorPersonaId: 30, turnoId: 8 });
  });

  it('rechaza operar un turno ajeno', async () => {
    findPersonaIdByUserId.mockResolvedValue(30);
    findTurno.mockResolvedValue({
      nutricionista: { idPersona: 99 },
    } as TurnoOrmEntity);
    const request = createRequest({
      user: { id: 5, rol: Rol.NUTRICIONISTA },
      params: { id: '8' },
    });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'No tenés permisos para operar sobre un turno ajeno.',
    );
  });

  it('permite bypass de admin', async () => {
    const request = createRequest({
      user: { id: 1, rol: Rol.ADMIN },
      params: { id: '8' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(findTurno).not.toHaveBeenCalled();
    expect(request.resourceAccess).toEqual({ turnoId: 8 });
  });

  it('permite a RECEPCIONISTA del mismo gimnasio', async () => {
    findTurno.mockResolvedValue({
      nutricionista: { gimnasioId: 1 },
    } as TurnoOrmEntity);
    const request = createRequest({
      user: { id: 10, rol: Rol.RECEPCIONISTA },
      params: { id: '8' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(findTurno).toHaveBeenCalled();
    expect(request.resourceAccess).toEqual({ turnoId: 8 });
  });

  it('rechaza a RECEPCIONISTA de otro gimnasio', async () => {
    findTurno.mockResolvedValue({
      nutricionista: { gimnasioId: 2 },
    } as TurnoOrmEntity);
    const request = createRequest({
      user: { id: 10, rol: Rol.RECEPCIONISTA },
      params: { id: '8' },
    });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'No tenés permisos para operar sobre un turno de otro gimnasio.',
    );
  });
});

interface RequestStub {
  params: Record<string, string>;
  resourceAccess?: {
    actorPersonaId?: number;
    turnoId: number;
  };
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
