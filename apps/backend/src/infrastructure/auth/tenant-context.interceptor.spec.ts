import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextInterceptor', () => {
  let interceptor: TenantContextInterceptor;
  let reflector: Reflector;
  let tenantContextService: TenantContextService;

  const mockTenantContextService = {
    setFromPayload: jest.fn(),
  };

  const createMockContext = (user: any, isPublic = false): ExecutionContext => {
    const mockRequest = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextInterceptor,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    interceptor = module.get<TenantContextInterceptor>(
      TenantContextInterceptor,
    );
    reflector = module.get<Reflector>(Reflector);
    tenantContextService =
      module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should skip tenant context on public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext({ id: 1 }, true);
    const next = { handle: () => 'result' };

    const result = interceptor.intercept(context, next);

    expect(result).toBe('result');
    expect(mockTenantContextService.setFromPayload).not.toHaveBeenCalled();
  });

  it('should call setFromPayload on non-public routes (service resolves user from REQUEST)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const user = {
      id: 1,
      email: 'test@test.com',
      rol: 'SOCIO',
      gimnasioId: 2,
      personaId: 10,
      jti: 'jti-123',
    };
    const context = createMockContext(user, false);
    const next = { handle: () => 'result' };

    interceptor.intercept(context, next);

    expect(mockTenantContextService.setFromPayload).toHaveBeenCalledWith();
  });

  it('should still call setFromPayload when user is missing (service will read REQUEST)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext(undefined, false);
    const next = { handle: () => 'result' };

    interceptor.intercept(context, next);

    expect(mockTenantContextService.setFromPayload).toHaveBeenCalledWith();
  });

  it('should still call next.handle even when tenant context is not set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext(undefined, false);
    const handleSpy = jest.fn().mockReturnValue('mocked Observable');
    const next = { handle: handleSpy };

    const result = interceptor.intercept(context, next);

    expect(handleSpy).toHaveBeenCalled();
    expect(result).toBe('mocked Observable');
  });
});
