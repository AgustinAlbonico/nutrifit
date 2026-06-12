import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from 'src/domain/exceptions/custom-exceptions';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import {
  IJwtService,
  JWT_SERVICE,
  JwtPayload,
} from 'src/domain/services/jwt.service';
import { ImpersonarUsuarioUseCase } from './impersonar-usuario.use-case';
import { randomUUID } from 'crypto';

describe('ImpersonarUsuarioUseCase', () => {
  let useCase: ImpersonarUsuarioUseCase;
  let mockUsuarioRepository: jest.Mocked<UsuarioRepository>;
  let mockGimnasioRepository: jest.Mocked<GimnasioRepository>;
  let mockJwtService: jest.Mocked<IJwtService>;

  const mockGimnasioEntity = (id: number, nombre: string) => ({
    id,
    nombre,
    direccion: 'direccion',
    telefono: null,
    email: null,
    fechaAlta: new Date(),
    fechaBaja: null,
    get activo() {
      return this.fechaBaja === null;
    },
  });

  const mockUsuarioEntity = (overrides: Partial<any> = {}) => ({
    idUsuario: 10,
    email: 'admin@gym.com',
    rol: Rol.ADMIN,
    getAccionesEfectivas: () => [],
    persona: {
      idPersona: 1,
      gimnasioId: 5,
      fechaBaja: null,
    },
    ...overrides,
  });

  beforeEach(async () => {
    mockUsuarioRepository = {
      findByEmail: jest.fn(),
      findAdminByGimnasioId: jest.fn(),
      findPerfilByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByPersonaId: jest.fn(),
    } as unknown as jest.Mocked<UsuarioRepository>;

    mockGimnasioRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findActivos: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByNombre: jest.fn(),
    } as unknown as jest.Mocked<GimnasioRepository>;

    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<IJwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpersonarUsuarioUseCase,
        { provide: USUARIO_REPOSITORY, useValue: mockUsuarioRepository },
        { provide: GIMNASIO_REPOSITORY, useValue: mockGimnasioRepository },
        { provide: JWT_SERVICE, useValue: mockJwtService },
      ],
    }).compile();

    useCase = module.get<ImpersonarUsuarioUseCase>(ImpersonarUsuarioUseCase);
  });

  afterEach(() => jest.clearAllMocks());

  describe('execute', () => {
    it('debe generar token de impersonacion para SUPERADMIN que impersona a ADMIN de gimnasio', async () => {
      const superadminId = 1;
      const gimnasioId = 5;
      const email = 'admin@gym.com';

      const gimnasio = mockGimnasioEntity(gimnasioId, 'Gym Central');
      const usuario = mockUsuarioEntity({ idUsuario: 10, rol: Rol.ADMIN });

      mockGimnasioRepository.findById.mockResolvedValue(gimnasio as any);
      mockUsuarioRepository.findByEmail.mockResolvedValue(usuario as any);
      mockJwtService.sign.mockReturnValue('jwt-token-impersonado');

      const result = await useCase.execute(superadminId, gimnasioId, email);

      expect(result.token).toBe('jwt-token-impersonado');
      expect(result.gimnasio.id).toBe(gimnasioId);
      expect(result.usuario.rol).toBe(Rol.ADMIN);
      expect(result.impersonatedBy).toBe(superadminId);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          gimnasioId: 5,
          impersonatedBy: 1,
          rol: Rol.ADMIN,
        }),
      );
    });

    it('debe impersonar al ADMIN activo del gimnasio cuando no se envia email', async () => {
      const superadminId = 1;
      const gimnasioId = 5;
      const gimnasio = mockGimnasioEntity(gimnasioId, 'Gym Central');
      const admin = mockUsuarioEntity({ idUsuario: 10, rol: Rol.ADMIN });

      mockGimnasioRepository.findById.mockResolvedValue(gimnasio as any);
      mockUsuarioRepository.findAdminByGimnasioId.mockResolvedValue(
        admin as any,
      );
      mockJwtService.sign.mockReturnValue('jwt-token-admin-gimnasio');

      const result = await useCase.execute(superadminId, gimnasioId);

      expect(mockUsuarioRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUsuarioRepository.findAdminByGimnasioId).toHaveBeenCalledWith(
        gimnasioId,
      );
      expect(result.token).toBe('jwt-token-admin-gimnasio');
      expect(result.usuario.rol).toBe(Rol.ADMIN);
    });

    it('debe lanzar NotFoundError si el gimnasio no existe', async () => {
      mockGimnasioRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(1, 999, 'admin@gym.com')).rejects.toThrow(
        NotFoundError,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundError si el usuario no existe', async () => {
      const gimnasio = mockGimnasioEntity(5, 'Gym Central');
      mockGimnasioRepository.findById.mockResolvedValue(gimnasio as any);
      mockUsuarioRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(1, 5, 'noexiste@gym.com')).rejects.toThrow(
        NotFoundError,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestError si se intenta impersonar a otro SUPERADMIN', async () => {
      const gimnasio = mockGimnasioEntity(5, 'Gym Central');
      const superadminUsuario = mockUsuarioEntity({
        idUsuario: 2,
        rol: Rol.SUPERADMIN,
        persona: null,
      });

      mockGimnasioRepository.findById.mockResolvedValue(gimnasio as any);
      mockUsuarioRepository.findByEmail.mockResolvedValue(
        superadminUsuario as any,
      );

      await expect(
        useCase.execute(1, 5, 'superadmin@nutrifit.com'),
      ).rejects.toThrow(BadRequestError);

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestError si el usuario a impersonar tiene fechaBaja', async () => {
      const gimnasio = mockGimnasioEntity(5, 'Gym Central');
      const usuarioInactivo = mockUsuarioEntity({
        idUsuario: 10,
        rol: Rol.ADMIN,
        persona: {
          idPersona: 1,
          gimnasioId: 5,
          fechaBaja: new Date(), // inactivo
        },
      });

      mockGimnasioRepository.findById.mockResolvedValue(gimnasio as any);
      mockUsuarioRepository.findByEmail.mockResolvedValue(
        usuarioInactivo as any,
      );

      await expect(useCase.execute(1, 5, 'admin@gym.com')).rejects.toThrow(
        BadRequestError,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestError si el usuario no pertenece al gimnasio especificado', async () => {
      const gimnasio = mockGimnasioEntity(5, 'Gym Central');
      const usuarioDeOtroGym = mockUsuarioEntity({
        idUsuario: 10,
        rol: Rol.ADMIN,
        persona: {
          idPersona: 1,
          gimnasioId: 99, // diferente gimnasio
          fechaBaja: null,
        },
      });

      mockGimnasioRepository.findById.mockResolvedValue(gimnasio as any);
      mockUsuarioRepository.findByEmail.mockResolvedValue(
        usuarioDeOtroGym as any,
      );

      await expect(useCase.execute(1, 5, 'admin@gym.com')).rejects.toThrow(
        BadRequestError,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
