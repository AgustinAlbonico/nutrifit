import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditoriaService,
  AuditoriaDto,
  FiltrosAuditoria,
} from './auditoria.service';
import {
  AuditoriaOrmEntity,
  AccionAuditoria,
} from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let repository: jest.Mocked<Repository<AuditoriaOrmEntity>>;
  let mockTenantContext: { isInitialized: boolean; gimnasioId: number };

  const createMockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  });

  const mockQueryBuilder = () => {
    const qb = {
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    return qb;
  };

  beforeEach(async () => {
    mockTenantContext = { isInitialized: false, gimnasioId: 0 };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        {
          provide: getRepositoryToken(AuditoriaOrmEntity),
          useValue: createMockRepo(),
        },
        {
          provide: TenantContextService,
          useValue: {
            get isInitialized() {
              return mockTenantContext.isInitialized;
            },
            get gimnasioId() {
              if (!mockTenantContext.isInitialized)
                throw new Error('Not initialized');
              return mockTenantContext.gimnasioId;
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
    repository = module.get(getRepositoryToken(AuditoriaOrmEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrar', () => {
    it('should use provided gimnasioId when given', async () => {
      const dto: AuditoriaDto = {
        usuarioId: 1,
        accion: AccionAuditoria.LOGIN_EXITO,
        entidad: 'Usuario',
        entidadId: 1,
        gimnasioId: 5,
      };

      repository.create.mockReturnValue({} as any);
      repository.save.mockResolvedValue({} as any);

      await service.registrar(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ gimnasioId: 5 }),
      );
    });

    it('should use tenant context when gimnasioId not provided', async () => {
      mockTenantContext.isInitialized = true;
      mockTenantContext.gimnasioId = 3;

      const dto: AuditoriaDto = {
        usuarioId: 1,
        accion: AccionAuditoria.LOGIN_EXITO,
        entidad: 'Usuario',
      };

      repository.create.mockReturnValue({} as any);
      repository.save.mockResolvedValue({} as any);

      await service.registrar(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ gimnasioId: 3 }),
      );
    });

    it('should set gimnasioId to null when no context and no provided', async () => {
      mockTenantContext.isInitialized = false;

      const dto: AuditoriaDto = {
        usuarioId: 1,
        accion: AccionAuditoria.LOGIN_EXITO,
        entidad: 'Usuario',
      };

      repository.create.mockReturnValue({} as any);
      repository.save.mockResolvedValue({} as any);

      await service.registrar(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ gimnasioId: null }),
      );
    });
  });

  describe('listarConFiltros', () => {
    it('should NOT filter by gimnasioId when explicitly null (admin request)', async () => {
      const qb = mockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb as any);

      await service.listarConFiltros({ gimnasioId: null });

      expect(qb.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('gimnasioId'),
        expect.anything(),
      );
    });

    it('should use tenant context when no gimnasioId provided and context exists', async () => {
      mockTenantContext.isInitialized = true;
      mockTenantContext.gimnasioId = 7;

      const qb = mockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb as any);

      await service.listarConFiltros({});

      expect(qb.andWhere).toHaveBeenCalledWith(
        'auditoria.gimnasioId = :gimnasioId',
        { gimnasioId: 7 },
      );
    });

    it('should NOT apply gimnasioId filter when no context and no gimnasioId provided', async () => {
      mockTenantContext.isInitialized = false;

      const qb = mockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb as any);

      await service.listarConFiltros({});

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('should apply explicit gimnasioId filter when provided', async () => {
      const qb = mockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb as any);

      await service.listarConFiltros({ gimnasioId: 10 });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'auditoria.gimnasioId = :gimnasioId',
        { gimnasioId: 10 },
      );
    });
  });

  describe('contarReprogramacionesSocioEnMes', () => {
    const mockCountQueryBuilder = (count: number) => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(count),
      };
      return qb;
    };

    it('debe devolver la cantidad contada por el query builder', async () => {
      const qb = mockCountQueryBuilder(3);
      repository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.contarReprogramacionesSocioEnMes(
        100,
        1,
        new Date('2026-06-15T12:00:00Z'),
      );

      expect(result).toBe(3);
      expect(qb.where).toHaveBeenCalledWith(
        'auditoria.usuarioId = :socioUsuarioId',
        { socioUsuarioId: 100 },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'auditoria.gimnasioId = :gimnasioId',
        { gimnasioId: 1 },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'auditoria.accion = :accion',
        { accion: 'TURNO_ESTADO_CAMBIO' },
      );
    });

    it('debe acotar la query al mes natural de la fecha de referencia', async () => {
      const qb = mockCountQueryBuilder(0);
      repository.createQueryBuilder.mockReturnValue(qb as any);

      await service.contarReprogramacionesSocioEnMes(
        100,
        1,
        new Date('2026-06-15T12:00:00Z'),
      );

      // Capturamos el andWhere del rango de fechas (5to en la cadena).
      const andWhereCalls = (qb.andWhere as jest.Mock).mock.calls;
      const callInicio = andWhereCalls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('inicioMes'),
      );
      const callFin = andWhereCalls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('finMes'),
      );
      expect(callInicio).toBeDefined();
      expect(callFin).toBeDefined();
      const paramsInicio = (callInicio as [string, { inicioMes: Date }])[1];
      const paramsFin = (callFin as [string, { finMes: Date }])[1];

      // Verificamos el shape inspeccionando el ISO string del Date.
      expect(paramsInicio.inicioMes.toISOString()).toMatch(/^2026-06-01/);
      expect(paramsFin.finMes.toISOString()).toMatch(/^2026-07-01/);
    });
  });
});
