import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './auth.guard';
import { JWT_SERVICE, IJwtService } from 'src/domain/services/jwt.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: IJwtService;

  const mockRequest = { headers: {} as Record<string, string | undefined> };

  const createMockContext = (authHeader?: string): ExecutionContext => {
    mockRequest.headers = authHeader ? { authorization: authHeader } : {};
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
        JwtAuthGuard,
        {
          provide: JWT_SERVICE,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<IJwtService>(JWT_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset shared mockRequest object between tests
    delete (mockRequest as any).user;
  });

  describe('public routes', () => {
    it('should allow public routes without token', () => {
      jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(true);
      const context = createMockContext(undefined);
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('token validation', () => {
    it('should throw UnauthorizedException when no authorization header', () => {
      jest
        .spyOn(guard['reflector'], 'getAllAndOverride')
        .mockReturnValue(false);
      const context = createMockContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'No token proporcionado',
      );
    });

    it('should throw UnauthorizedException for invalid token format', () => {
      jest
        .spyOn(guard['reflector'], 'getAllAndOverride')
        .mockReturnValue(false);
      const context = createMockContext('InvalidFormat');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Formato de token invalido',
      );
    });

    it('should attach user to request when token is valid with tenant context', () => {
      jest
        .spyOn(guard['reflector'], 'getAllAndOverride')
        .mockReturnValue(false);
      const payload = {
        id: 1,
        email: 'test@test.com',
        rol: 'SOCIO' as Rol,
        personaId: 10,
        gimnasioId: 2,
        jti: 'jti-123',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload as any);

      const result = guard.canActivate(createMockContext('Bearer valid-token'));

      expect(result).toBe(true);
      expect((mockRequest as any).user).toEqual(payload);
    });

    it('should throw UnauthorizedException for invalid token', () => {
      jest
        .spyOn(guard['reflector'], 'getAllAndOverride')
        .mockReturnValue(false);
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const context = createMockContext('Bearer invalid-token');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Token inválido');
    });
  });

  describe('tenant context enforcement', () => {
    it('should throw UnauthorizedException when token is valid but missing gimnasioId', () => {
      jest
        .spyOn(guard['reflector'], 'getAllAndOverride')
        .mockReturnValue(false);

      // Token is cryptographically valid (JWT structure is correct)
      // but the payload lacks the required gimnasioId claim
      const payloadWithoutTenant = {
        id: 1,
        email: 'test@test.com',
        rol: 'SOCIO' as Rol,
        personaId: 10,
        // gimnasioId is MISSING
        jti: 'jti-123',
      };

      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(payloadWithoutTenant as any);

      const context = createMockContext('Bearer valid-but-tenantless-token');

      // The guard MUST reject this — tenant isolation depends on it
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Token sin contexto de tenant',
      );
      // User must NOT be attached to request
      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should throw UnauthorizedException when gimnasioId is explicitly null', () => {
      jest
        .spyOn(guard['reflector'], 'getAllAndOverride')
        .mockReturnValue(false);

      const payloadWithNullTenant = {
        id: 1,
        email: 'test@test.com',
        rol: 'NUTRICIONISTA' as Rol,
        personaId: 5,
        gimnasioId: null as any, // explicitly null
        jti: 'jti-456',
      };

      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(payloadWithNullTenant as any);

      const context = createMockContext('Bearer token-with-null-tenant');

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Token sin contexto de tenant',
      );
      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should throw UnauthorizedException when gimnasioId is explicitly undefined', () => {
      jest
        .spyOn(guard['reflector'], 'getAllAndOverride')
        .mockReturnValue(false);

      const payloadWithUndefinedTenant = {
        id: 1,
        email: 'admin@nutrifit.com',
        rol: 'ADMIN' as Rol,
        personaId: 1,
        gimnasioId: undefined as any, // explicitly undefined
        jti: 'jti-789',
      };

      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(payloadWithUndefinedTenant as any);

      const context = createMockContext('Bearer token-with-undefined-tenant');

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Token sin contexto de tenant',
      );
      expect((mockRequest as any).user).toBeUndefined();
    });
  });
});
