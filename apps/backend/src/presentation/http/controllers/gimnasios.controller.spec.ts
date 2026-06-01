import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundError, ConflictError } from 'src/domain/exceptions/custom-exceptions';
import { GimnasiosController } from './gimnasios.controller';
import { CrearGimnasioUseCase } from 'src/application/gimnasios/use-cases/crear-gimnasio.use-case';
import { ListarGimnasiosUseCase } from 'src/application/gimnasios/use-cases/listar-gimnasios.use-case';
import { ObtenerGimnasioUseCase } from 'src/application/gimnasios/use-cases/obtener-gimnasio.use-case';
import { ActualizarGimnasioUseCase } from 'src/application/gimnasios/use-cases/actualizar-gimnasio.use-case';
import { EliminarGimnasioUseCase } from 'src/application/gimnasios/use-cases/eliminar-gimnasio.use-case';
import { ImpersonarUsuarioUseCase } from 'src/application/gimnasios/use-cases/impersonar-usuario.use-case';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';

describe('GimnasiosController', () => {
  let controller: GimnasiosController;
  let mockCrear: jest.Mocked<CrearGimnasioUseCase>;
  let mockListar: jest.Mocked<ListarGimnasiosUseCase>;
  let mockObtener: jest.Mocked<ObtenerGimnasioUseCase>;
  let mockActualizar: jest.Mocked<ActualizarGimnasioUseCase>;
  let mockEliminar: jest.Mocked<EliminarGimnasioUseCase>;
  let mockImpersonar: jest.Mocked<ImpersonarUsuarioUseCase>;

  const mockGimnasio = (overrides: Partial<GimnasioEntity> = {}): GimnasioEntity => {
    return new GimnasioEntity({
      id: 1,
      nombre: 'Gym Central',
      direccion: 'Calle Principal 123',
      telefono: '1234567890',
      email: null,
      fechaAlta: new Date(),
      fechaBaja: null,
      ...overrides,
    });
  };

  beforeEach(async () => {
    mockCrear = { execute: jest.fn() } as any;
    mockListar = { execute: jest.fn() } as any;
    mockObtener = { execute: jest.fn() } as any;
    mockActualizar = { execute: jest.fn() } as any;
    mockEliminar = { execute: jest.fn() } as any;
    mockImpersonar = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GimnasiosController],
      providers: [
        { provide: CrearGimnasioUseCase, useValue: mockCrear },
        { provide: ListarGimnasiosUseCase, useValue: mockListar },
        { provide: ObtenerGimnasioUseCase, useValue: mockObtener },
        { provide: ActualizarGimnasioUseCase, useValue: mockActualizar },
        { provide: EliminarGimnasioUseCase, useValue: mockEliminar },
        { provide: ImpersonarUsuarioUseCase, useValue: mockImpersonar },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GimnasiosController>(GimnasiosController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /gimnasios', () => {
    it('debe crear un gimnasio y retornar su informacion', async () => {
      const dto = { nombre: 'Gym Central', direccion: 'Calle 123' };
      const gimnasio = mockGimnasio({ nombre: 'Gym Central' });
      mockCrear.execute.mockResolvedValue(gimnasio);

      const result = await controller.crear(dto);

      expect(mockCrear.execute).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
      expect(result.nombre).toBe('Gym Central');
    });
  });

  describe('GET /gimnasios', () => {
    it('debe listar todos los gimnasios activos', async () => {
      const gimnasios = [
        mockGimnasio({ id: 1, nombre: 'Gym Central' }),
        mockGimnasio({ id: 2, nombre: 'Gym Norte' }),
      ];
      mockListar.execute.mockResolvedValue(gimnasios);

      const result = await controller.listar();

      expect(mockListar.execute).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Gym Central');
    });

    it('debe retornar array vacio cuando no hay gimnasios', async () => {
      mockListar.execute.mockResolvedValue([]);

      const result = await controller.listar();

      expect(result).toEqual([]);
    });
  });

  describe('GET /gimnasios/:id', () => {
    it('debe obtener un gimnasio por ID', async () => {
      const gimnasio = mockGimnasio({ id: 5 });
      mockObtener.execute.mockResolvedValue(gimnasio);

      const result = await controller.obtener(5);

      expect(mockObtener.execute).toHaveBeenCalledWith(5);
      expect(result.id).toBe(5);
    });

    it('debe propagar NotFoundError si no existe', async () => {
      mockObtener.execute.mockRejectedValue(new NotFoundError('Gimnasio', '999'));

      await expect(controller.obtener(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('PATCH /gimnasios/:id', () => {
    it('debe actualizar un gimnasio existente', async () => {
      const dto = { nombre: 'Gym Actualizado' };
      const gimnasio = mockGimnasio({ nombre: 'Gym Actualizado' });
      mockActualizar.execute.mockResolvedValue(gimnasio);

      const result = await controller.actualizar(1, dto);

      expect(mockActualizar.execute).toHaveBeenCalledWith(1, dto);
      expect(result.nombre).toBe('Gym Actualizado');
    });
  });

  describe('DELETE /gimnasios/:id', () => {
    it('debe eliminar un gimnasio (soft delete)', async () => {
      mockEliminar.execute.mockResolvedValue();

      await controller.eliminar(1);

      expect(mockEliminar.execute).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /gimnasios/:id/impersonar', () => {
    it('debe impersonar a un usuario del gimnasio', async () => {
      const resultado = {
        token: 'jwt-token',
        usuario: { id: 10, email: 'admin@gym.com', rol: Rol.ADMIN },
        gimnasio: { id: 5, nombre: 'Gym Central' },
        impersonatedBy: 1,
        expiraEn: '2h',
      };
      mockImpersonar.execute.mockResolvedValue(resultado);

      const result = await controller.impersonar(5, { email: 'admin@gym.com' }, 1);

      expect(mockImpersonar.execute).toHaveBeenCalledWith(1, 5, 'admin@gym.com');
      expect(result.token).toBe('jwt-token');
      expect(result.gimnasio.id).toBe(5);
      expect(result.impersonatedBy).toBe(1);
    });
  });
});