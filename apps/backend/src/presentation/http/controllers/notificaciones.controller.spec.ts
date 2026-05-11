import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { EstadoNotificacion } from 'src/domain/entities/Notificacion/estado-notificacion.enum';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { SetMetadata } from '@nestjs/common';
import { ROLE_KEY } from 'src/infrastructure/auth/decorators/role.decorator';

describe('NotificacionesController - Admin', () => {
  let controller: NotificacionesController;
  let service: NotificacionesService;

  const mockService = {
    listarAdmin: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificacionesController],
      providers: [{ provide: NotificacionesService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ActionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificacionesController>(NotificacionesController);
    service = module.get<NotificacionesService>(NotificacionesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /notificaciones', () => {
    it('debe permitir acceso a ADMIN y devolver notificaciones filtradas', async () => {
      const resultadoEsperado = {
        data: [
          {
            idNotificacion: 1,
            destinatarioId: 5,
            tipo: TipoNotificacion.TURNO_RESERVADO,
            titulo: 'Turno confirmado',
            mensaje: 'Tu turno fue confirmado',
            estado: EstadoNotificacion.LEIDA,
            createdAt: new Date(),
          },
        ],
        total: 1,
      };
      mockService.listarAdmin.mockResolvedValue(resultadoEsperado);

      const req = { user: { id: 1, rol: RolEnum.ADMIN } } as any;
      const result = await controller.listarAdmin(
        '5',
        TipoNotificacion.TURNO_RESERVADO,
        EstadoNotificacion.LEIDA,
        '2025-01-01',
        '2025-12-31',
        '1',
        '20',
      );

      expect(mockService.listarAdmin).toHaveBeenCalledWith({
        destinatarioId: 5,
        tipo: TipoNotificacion.TURNO_RESERVADO,
        estado: EstadoNotificacion.LEIDA,
        desde: new Date('2025-01-01'),
        hasta: new Date('2025-12-31'),
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(resultadoEsperado);
    });

    it('debe funcionar sin filtros', async () => {
      mockService.listarAdmin.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.listarAdmin(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(mockService.listarAdmin).toHaveBeenCalledWith({
        destinatarioId: undefined,
        tipo: undefined,
        estado: undefined,
        desde: undefined,
        hasta: undefined,
        page: undefined,
        limit: undefined,
      });
      expect(result).toEqual({ data: [], total: 0 });
    });
  });
});

describe('NotificacionesController - Admin Unauthorized', () => {
  it('debe denegar acceso a usuario no-ADMIN', async () => {
    const reflector = new Reflector();
    const rolesGuard = new RolesGuard(reflector);

    // Setup: set metadata to require ADMIN role
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 1, rol: 'SOCIO' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    // Simular que el handler tiene @Rol(RolEnum.ADMIN)
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RolEnum.ADMIN]);

    const canActivate = rolesGuard.canActivate(context);
    expect(canActivate).toBe(false);
  });
});
