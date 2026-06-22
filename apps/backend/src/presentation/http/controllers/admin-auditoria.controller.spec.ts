import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuditoriaController } from './admin-auditoria.controller';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import type { PaginatedData } from '@nutrifit/shared';

describe('AdminAuditoriaController', () => {
  let controller: AdminAuditoriaController;
  let service: jest.Mocked<AuditoriaService>;

  const mockAuditoriaService = {
    listarConFiltros: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuditoriaController],
      providers: [
        { provide: AuditoriaService, useValue: mockAuditoriaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminAuditoriaController>(AdminAuditoriaController);
    service = module.get(AuditoriaService);
  });

  const usuarioMock = {
    id: 1,
    email: 'admin@nutrifit.com',
    rol: Rol.ADMIN,
    gimnasioId: 5,
    personaId: null,
    jti: 'test-jti',
  };

  afterEach(() => jest.clearAllMocks());

  describe('GET /admin/auditoria', () => {
    const registroMock = {
      idAuditoria: 1,
      usuarioId: 10,
      accion: 'CREAR',
      entidad: 'Socio',
      entidadId: 5,
      timestamp: new Date('2025-06-01T10:00:00Z'),
      ipOrigen: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      metadata: { detalle: 'Socio creado exitosamente' },
    };

    const paginatedResponseMock = (data: typeof registroMock[]): PaginatedData<typeof registroMock> => ({
      data,
      pagination: {
        page: 1,
        limit: 20,
        total: data.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    it('debe usar gimnasioId del usuario autenticado cuando no se especifica', async () => {
      mockAuditoriaService.listarConFiltros.mockResolvedValue(paginatedResponseMock([]));

      await controller.listarAuditoria({
        fechaDesde: '2025-01-01',
        fechaHasta: '2025-12-31',
      }, usuarioMock);

      expect(mockAuditoriaService.listarConFiltros).toHaveBeenCalledWith(expect.objectContaining({
        gimnasioId: 5,
      }));
    });

    it('debe llamar a listarConFiltros con gimnasioId correctamente', async () => {
      mockAuditoriaService.listarConFiltros.mockResolvedValue(paginatedResponseMock([registroMock]));

      const result = await controller.listarAuditoria({
        gimnasioId: 5,
        fechaDesde: '2025-01-01',
        fechaHasta: '2025-06-01',
        accion: 'PLAN_CREADO' as AccionAuditoria,
        entidad: 'Socio',
        usuarioId: 10,
      }, usuarioMock);

      expect(mockAuditoriaService.listarConFiltros).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        fechaDesde: new Date('2025-01-01'),
        fechaHasta: new Date('2025-06-01'),
        accion: AccionAuditoria.PLAN_CREADO,
        entidad: 'Socio',
        usuarioId: 10,
        gimnasioId: 5,
      });

      expect(result).toEqual(paginatedResponseMock([registroMock]));
    });

    it('debe ignorar null gimnasioId y usar el del usuario autenticado', async () => {
      mockAuditoriaService.listarConFiltros.mockResolvedValue(paginatedResponseMock([]));

      const result = await controller.listarAuditoria({
        gimnasioId: null as any,
      }, usuarioMock);

      // null ?? usuario.gimnasioId = 5 para rol ADMIN
      expect(mockAuditoriaService.listarConFiltros).toHaveBeenCalledWith(expect.objectContaining({
        gimnasioId: 5,
      }));
      expect(result).toEqual(paginatedResponseMock([]));
    });

    it('debe usar gimnasioId del usuario cuando se pasa undefined explícito', async () => {
      mockAuditoriaService.listarConFiltros.mockResolvedValue(paginatedResponseMock([]));

      await controller.listarAuditoria({
        gimnasioId: undefined,
      }, usuarioMock);

      expect(mockAuditoriaService.listarConFiltros).toHaveBeenCalledWith(expect.objectContaining({
        gimnasioId: 5,
      }));
    });

    it('debe permitir la consulta solo con gimnasioId (sin otros filtros)', async () => {
      mockAuditoriaService.listarConFiltros.mockResolvedValue(paginatedResponseMock([]));

      await controller.listarAuditoria({
        gimnasioId: 99,
      }, usuarioMock);

      expect(mockAuditoriaService.listarConFiltros).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        gimnasioId: 99,
        fechaDesde: undefined,
        fechaHasta: undefined,
        accion: undefined,
        entidad: undefined,
        usuarioId: undefined,
      });
    });

    it('debe propagar errores del servicio sin modificar', async () => {
      mockAuditoriaService.listarConFiltros.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        controller.listarAuditoria({ gimnasioId: 5 }, usuarioMock),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
