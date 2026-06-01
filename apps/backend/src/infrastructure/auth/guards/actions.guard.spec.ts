import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActionsGuard } from './actions.guard';
import { PermisosService } from 'src/application/permisos/permisos.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { Request } from 'express';

describe('ActionsGuard', () => {
  let guard: ActionsGuard;
  let permisosService: PermisosService;

  const mockRequest = (user: any) => ({ user } as Request);

  const createMockContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => mockRequest(user) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: PermisosService,
          useValue: { hasAllActions: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<ActionsGuard>(ActionsGuard);
    permisosService = module.get<PermisosService>(PermisosService);
  });

  it('debe bypassear SUPERADMIN sin chequear permisos', async () => {
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(['gimnasios.crear']);
    const superUser = { id: 1, email: 'super@nutrifit.com', rol: Rol.SUPERADMIN };

    const result = await guard.canActivate(createMockContext(superUser));

    expect(result).toBe(true);
    expect(permisosService.hasAllActions).not.toHaveBeenCalled();
  });

  it('NO debe bypassear ADMIN - debe chequear permisos explicitos', async () => {
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(['gimnasios.crear']);
    const adminUser = { id: 2, email: 'admin@nutrifit.com', rol: Rol.ADMIN };

    jest.spyOn(permisosService, 'hasAllActions').mockResolvedValue(false);

    await expect(
      guard.canActivate(createMockContext(adminUser)),
    ).rejects.toThrow(ForbiddenException);

    expect(permisosService.hasAllActions).toHaveBeenCalledWith(2, ['gimnasios.crear']);
  });

  it('ADMIN con permisos explicitos debe pasar', async () => {
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(['socios.ver']);
    const adminUser = { id: 2, email: 'admin@nutrifit.com', rol: Rol.ADMIN };

    jest.spyOn(permisosService, 'hasAllActions').mockResolvedValue(true);

    const result = await guard.canActivate(createMockContext(adminUser));

    expect(result).toBe(true);
  });
});