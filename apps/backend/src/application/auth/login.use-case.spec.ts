import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedError } from 'src/domain/exceptions/custom-exceptions';
import { LoginUseCase } from './login.use-case';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import {
  PASSWORD_ENCRYPTER_SERVICE,
  IPasswordEncrypterService,
} from 'src/domain/services/password-encrypter.service';
import {
  JWT_SERVICE,
  IJwtService,
  JwtPayload,
} from 'src/domain/services/jwt.service';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { PersonaEntity } from 'src/domain/entities/Persona/persona.entity';
import { UsuarioEntity } from 'src/domain/entities/Usuario/usuario.entity';

describe('LoginUseCase - fechaBaja blocking', () => {
  let useCase: LoginUseCase;
  let userRepository: UsuarioRepository;
  let passwordEncrypter: IPasswordEncrypterService;
  let jwtService: IJwtService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockPersonaActiva: Partial<PersonaEntity> = {
    idPersona: 1,
    idPersonaNullable: null,
    nombre: 'Juan',
    apellido: 'Pérez',
    fechaBaja: null,
    gimnasioId: 5,
  };

  const mockPersonaInactiva: Partial<PersonaEntity> = {
    idPersona: 2,
    idPersonaNullable: null,
    nombre: 'María',
    apellido: 'García',
    fechaBaja: new Date('2025-01-01'),
    gimnasioId: 5,
  };

  const mockUser: UsuarioEntity = {
    idUsuario: 1,
    email: 'juan@test.com',
    contraseña: 'hashedPassword123',
    debeCambiarPassword: false,
    fechaHoraAlta: new Date(),
    fechaBaja: null,
    rol: 'SOCIO' as Rol,
    persona: mockPersonaActiva as PersonaEntity,
    grupos: [],
    acciones: [],
    getAccionesEfectivas: () => [],
  };

  const mockUserInactivo: UsuarioEntity = {
    idUsuario: 2,
    email: 'maria@test.com',
    contraseña: 'hashedPassword123',
    debeCambiarPassword: false,
    fechaHoraAlta: new Date(),
    fechaBaja: null,
    rol: 'SOCIO' as Rol,
    persona: mockPersonaInactiva as PersonaEntity,
    grupos: [],
    acciones: [],
    getAccionesEfectivas: () => [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: USUARIO_REPOSITORY,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: PASSWORD_ENCRYPTER_SERVICE,
          useValue: {
            comparePasswords: jest.fn(),
          },
        },
        {
          provide: JWT_SERVICE,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    userRepository = module.get<UsuarioRepository>(USUARIO_REPOSITORY);
    passwordEncrypter = module.get<IPasswordEncrypterService>(
      PASSWORD_ENCRYPTER_SERVICE,
    );
    jwtService = module.get<IJwtService>(JWT_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fechaBaja blocking', () => {
    it('debe bloquear login cuando persona tiene fechaBaja activa', async () => {
      jest
        .spyOn(userRepository, 'findByEmail')
        .mockResolvedValue(mockUserInactivo);
      jest.spyOn(passwordEncrypter, 'comparePasswords').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('fake-jwt-token');

      await expect(
        useCase.execute({ email: 'maria@test.com', contrasena: 'password123' }),
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        useCase.execute({ email: 'maria@test.com', contrasena: 'password123' }),
      ).rejects.toThrow('La cuenta está inactiva');
    });

    it('debe permitir login cuando persona no tiene fechaBaja', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(passwordEncrypter, 'comparePasswords').mockResolvedValue(true);

      let capturedPayload: JwtPayload | null = null;
      jest.spyOn(jwtService, 'sign').mockImplementation((payload) => {
        capturedPayload = payload as JwtPayload;
        return 'fake-jwt-token';
      });

      const result = await useCase.execute({
        email: 'juan@test.com',
        contrasena: 'password123',
      });

      expect(result.token).toBe('fake-jwt-token');
      expect(result.rol).toBe('SOCIO');
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload!.gimnasioId).toBe(5);
      expect(capturedPayload!.personaId).toBe(1);
      expect(capturedPayload!.jti).toBeDefined();
      expect(typeof capturedPayload!.jti).toBe('string');
    });

    it('debe incluir gimnasioId y personaId en el JWT payload', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(passwordEncrypter, 'comparePasswords').mockResolvedValue(true);

      let capturedPayload: JwtPayload | null = null;
      jest.spyOn(jwtService, 'sign').mockImplementation((payload) => {
        capturedPayload = payload as JwtPayload;
        return 'token-test';
      });

      await useCase.execute({
        email: 'juan@test.com',
        contrasena: 'password123',
      });

      expect(capturedPayload!.gimnasioId).toBe(mockPersonaActiva.gimnasioId);
      expect(capturedPayload!.personaId).toBe(mockPersonaActiva.idPersona);
      expect(capturedPayload!.jti).toBeTruthy();
      expect(capturedPayload!.id).toBe(mockUser.idUsuario);
      expect(capturedPayload!.email).toBe(mockUser.email);
      expect(capturedPayload!.rol).toBe(mockUser.rol);
    });
  });
});

describe('SUPERADMIN without persona', () => {
  let useCase: LoginUseCase;
  let userRepository: UsuarioRepository;
  let passwordEncrypter: IPasswordEncrypterService;
  let jwtService: IJwtService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockSuperAdmin: UsuarioEntity = {
    idUsuario: 99,
    email: 'super@nutrifit.com',
    contraseña: 'hashed',
    debeCambiarPassword: false,
    fechaHoraAlta: new Date(),
    fechaBaja: null,
    rol: 'SUPERADMIN' as Rol,
    persona: null, // SUPERADMIN no tiene persona
    grupos: [],
    acciones: [],
    getAccionesEfectivas: () => [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: USUARIO_REPOSITORY,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: PASSWORD_ENCRYPTER_SERVICE,
          useValue: {
            comparePasswords: jest.fn(),
          },
        },
        {
          provide: JWT_SERVICE,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    userRepository = module.get<UsuarioRepository>(USUARIO_REPOSITORY);
    passwordEncrypter = module.get<IPasswordEncrypterService>(
      PASSWORD_ENCRYPTER_SERVICE,
    );
    jwtService = module.get<IJwtService>(JWT_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe emitir JWT con gimnasioId null para SUPERADMIN sin persona', async () => {
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockSuperAdmin);
    jest.spyOn(passwordEncrypter, 'comparePasswords').mockResolvedValue(true);

    let capturedPayload: JwtPayload | null = null;
    jest.spyOn(jwtService, 'sign').mockImplementation((payload) => {
      capturedPayload = payload as JwtPayload;
      return 'fake-jwt-token';
    });

    const result = await useCase.execute({
      email: 'super@nutrifit.com',
      contrasena: 'password',
    });

    expect(result.token).toBe('fake-jwt-token');
    expect(result.rol).toBe('SUPERADMIN');
    expect(capturedPayload!.gimnasioId).toBeNull();
    expect(capturedPayload!.personaId).toBeNull();
  });
});

describe('LoginUseCase - non-SUPERADMIN without gimnasioId should fail', () => {
  let useCase: LoginUseCase;
  let userRepository: UsuarioRepository;
  let passwordEncrypter: IPasswordEncrypterService;
  let jwtService: IJwtService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockUserNoGym: UsuarioEntity = {
    idUsuario: 50,
    email: 'nogym@test.com',
    contraseña: 'hashed',
    debeCambiarPassword: false,
    fechaHoraAlta: new Date(),
    fechaBaja: null,
    rol: 'SOCIO' as Rol,
    persona: {
      idPersona: 5,
      gimnasioId: null, // inconsistent state
    } as any,
    grupos: [],
    acciones: [],
    getAccionesEfectivas: () => [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: USUARIO_REPOSITORY,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: PASSWORD_ENCRYPTER_SERVICE,
          useValue: {
            comparePasswords: jest.fn(),
          },
        },
        {
          provide: JWT_SERVICE,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    userRepository = module.get<UsuarioRepository>(USUARIO_REPOSITORY);
    passwordEncrypter = module.get<IPasswordEncrypterService>(
      PASSWORD_ENCRYPTER_SERVICE,
    );
    jwtService = module.get<IJwtService>(JWT_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe rechazar SOCIO con gimnasioId null (estado inconsistente)', async () => {
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUserNoGym);
    jest.spyOn(passwordEncrypter, 'comparePasswords').mockResolvedValue(true);

    await expect(
      useCase.execute({ email: 'nogym@test.com', contrasena: 'password' }),
    ).rejects.toThrow('La cuenta no tiene gimnasio asignado');
  });
});
