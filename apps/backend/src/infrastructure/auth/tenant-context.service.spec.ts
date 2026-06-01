import { Request } from 'express';
import { TenantContextService } from './tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

describe('TenantContextService', () => {
  const mockRequest = (user?: any): Request => ({ user }) as Request;

  describe('when initialized with a valid user', () => {
    const user = {
      id: 1,
      email: 'test@test.com',
      rol: 'SOCIO' as Rol,
      gimnasioId: 5,
      personaId: 10,
      jti: 'jti-abc-123',
    };
    const service = new TenantContextService(mockRequest(user));

    it('should report isInitialized true', () => {
      expect(service.isInitialized).toBe(true);
    });

    it('should return the correct gimnasioId', () => {
      expect(service.gimnasioId).toBe(5);
    });

    it('should return the correct personaId', () => {
      expect(service.personaId).toBe(10);
    });

    it('should return the correct usuarioId', () => {
      expect(service.usuarioId).toBe(1);
    });

    it('should return the correct jti', () => {
      expect(service.jti).toBe('jti-abc-123');
    });

    it('should return the correct rol', () => {
      expect(service.rol).toBe('SOCIO');
    });

    it('should serialize to correct JSON', () => {
      const json = service.toJSON();
      expect(json.gimnasioId).toBe(5);
      expect(json.personaId).toBe(10);
      expect(json.usuarioId).toBe(1);
      expect(json.jti).toBe('jti-abc-123');
      expect(json.rol).toBe('SOCIO');
    });
  });

  describe('when initialized with no user', () => {
    const service = new TenantContextService(mockRequest(undefined));

    it('should report isInitialized false', () => {
      expect(service.isInitialized).toBe(false);
    });

    it('should throw on gimnasioId access', () => {
      expect(() => service.gimnasioId).toThrow(
        'Tenant context not initialized — ensure JwtAuthGuard is applied',
      );
    });

    it('should throw on usuarioId access', () => {
      expect(() => service.usuarioId).toThrow('Tenant context not initialized');
    });

    it('should return null for personaId', () => {
      expect(service.personaId).toBeNull();
    });

    it('should return null for jti', () => {
      expect(service.jti).toBeNull();
    });

    it('should return null for rol', () => {
      expect(service.rol).toBeNull();
    });
  });

  describe('when initialized with user missing optional fields', () => {
    const user = { id: 1, email: 'test@test.com', rol: 'ADMIN' as Rol };
    const service = new TenantContextService(mockRequest(user));

    it('should report isInitialized false because gimnasioId is missing', () => {
      expect(service.isInitialized).toBe(false);
    });

    it('should set gimnasioId to null', () => {
      // Accessing isInitialized is false, so getter would throw
      expect((service as any)._gimnasioId).toBeNull();
    });
  });

  describe('setFromPayload', () => {
    it('should set all fields from payload', () => {
      const service = new TenantContextService(mockRequest(undefined));
      const payload = {
        id: 2,
        email: 'user@test.com',
        rol: 'NUTRICIONISTA' as Rol,
        gimnasioId: 8,
        personaId: 20,
        jti: 'jti-xyz',
      };

      service.setFromPayload(payload as any);

      expect(service.isInitialized).toBe(true);
      expect(service.gimnasioId).toBe(8);
      expect(service.personaId).toBe(20);
      expect(service.usuarioId).toBe(2);
      expect(service.jti).toBe('jti-xyz');
      expect(service.rol).toBe('NUTRICIONISTA');
    });

    it('should handle null values in payload', () => {
      const service = new TenantContextService(mockRequest(undefined));
      const payload = {
        id: 3,
        email: 'admin@test.com',
        rol: 'ADMIN' as Rol,
        gimnasioId: null as any,
        personaId: null,
        jti: '',
      };

      service.setFromPayload(payload as any);

      expect(service.isInitialized).toBe(false);
      expect(service.personaId).toBeNull();
    });
  });
});
