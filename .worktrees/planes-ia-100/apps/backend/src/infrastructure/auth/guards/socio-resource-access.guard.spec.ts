import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { ObjetivoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/objetivo.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { SocioResourceAccessGuard } from './socio-resource-access.guard';

describe('SocioResourceAccessGuard', () => {
  let guard: SocioResourceAccessGuard;
  let countTurnos: jest.Mock;
  let findPersonaIdByUserId: jest.Mock;
  let findObjetivo: jest.Mock;
  let usuarioRepository: jest.Mocked<UsuarioRepository>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let planRepository: jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;
  let fotoRepository: jest.Mocked<Repository<FotoProgresoOrmEntity>>;
  let objetivoRepository: jest.Mocked<Repository<ObjetivoOrmEntity>>;

  beforeEach(() => {
    findPersonaIdByUserId = jest.fn();
    countTurnos = jest.fn();
    findObjetivo = jest.fn();

    usuarioRepository = {
      findPersonaIdByUserId,
    } as unknown as jest.Mocked<UsuarioRepository>;

    turnoRepository = {
      count: countTurnos,
    } as unknown as jest.Mocked<Repository<TurnoOrmEntity>>;

    planRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;

    fotoRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<FotoProgresoOrmEntity>>;

    objetivoRepository = {
      findOne: findObjetivo,
    } as unknown as jest.Mocked<Repository<ObjetivoOrmEntity>>;

    guard = new SocioResourceAccessGuard(
      usuarioRepository,
      turnoRepository,
      planRepository,
      fotoRepository,
      objetivoRepository,
    );
  });

  it('permite a un socio acceder a su propio recurso', async () => {
    findPersonaIdByUserId.mockResolvedValue(10);
    const request = createRequest({
      user: { id: 1, rol: Rol.SOCIO },
      params: { socioId: '10' },
      baseUrl: '/progreso',
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.resourceAccess).toEqual({ actorPersonaId: 10, socioId: 10 });
  });

  it('rechaza a un socio que intenta acceder a otro socio', async () => {
    findPersonaIdByUserId.mockResolvedValue(10);
    const request = createRequest({
      user: { id: 1, rol: Rol.SOCIO },
      params: { socioId: '44' },
      baseUrl: '/progreso',
    });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('permite a un nutricionista con vínculo acceder al socio', async () => {
    findPersonaIdByUserId.mockResolvedValue(20);
    countTurnos.mockResolvedValue(2);
    const request = createRequest({
      user: { id: 7, rol: Rol.NUTRICIONISTA },
      params: { socioId: '15' },
      baseUrl: '/progreso',
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(countTurnos).toHaveBeenCalledWith({
      where: {
        nutricionista: { idPersona: 20 },
        socio: { idPersona: 15 },
      },
    });
  });

  it('rechaza a un nutricionista sin vínculo con el socio', async () => {
    findPersonaIdByUserId.mockResolvedValue(20);
    countTurnos.mockResolvedValue(0);
    const request = createRequest({
      user: { id: 7, rol: Rol.NUTRICIONISTA },
      params: { socioId: '15' },
      baseUrl: '/progreso',
    });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'No tenés permisos para acceder a recursos de un socio sin vínculo.',
    );
  });

  it('rechaza ids inconsistentes entre recurso y socio de ruta', async () => {
    findPersonaIdByUserId.mockResolvedValue(10);
    findObjetivo.mockResolvedValue({
      socio: { idPersona: 99 },
    } as ObjetivoOrmEntity);
    const request = createRequest({
      user: { id: 1, rol: Rol.SOCIO },
      params: { socioId: '10', objetivoId: '3' },
      baseUrl: '/progreso',
    });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'El recurso no pertenece al socio indicado.',
    );
  });
});

interface RequestStub {
  baseUrl: string;
  body: Record<string, unknown>;
  params: Record<string, string>;
  resourceAccess?: {
    actorPersonaId: number | null;
    socioId: number | null;
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
    body: {},
    params: {},
    baseUrl: '',
    ...overrides,
  };
}
