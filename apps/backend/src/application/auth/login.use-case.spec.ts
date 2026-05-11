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
import { JWT_SERVICE, IJwtService } from 'src/domain/services/jwt.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { PersonaEntity } from 'src/domain/entities/Persona/persona.entity';

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
    nombre: 'Juan',
    apellido: 'Pérez',
    fechaBaja: null,
  };

  const mockPersonaInactiva: Partial<PersonaEntity> = {
    idPersona: 2,
    nombre: 'María',
    apellido: 'García',
    fechaBaja: new Date('2025-01-01'),
  };

  const mockUser = {
    idUsuario: 1,
    email: 'juan@test.com',
    contraseña: 'hashedPassword123',
    rol: 'SOCIO' as Rol,
    persona: mockPersonaActiva as PersonaEntity,
    grupos: [],
    acciones: [],
    getAccionesEfectivas: () => [],
  };

  const mockUserInactivo = {
    idUsuario: 2,
    email: 'maria@test.com',
    contraseña: 'hashedPassword123',
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
        .mockResolvedValue(mockUserInactivo as any);
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
      jest
        .spyOn(userRepository, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest.spyOn(passwordEncrypter, 'comparePasswords').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('fake-jwt-token');

      const result = await useCase.execute({
        email: 'juan@test.com',
        contrasena: 'password123',
      });

      expect(result.token).toBe('fake-jwt-token');
      expect(result.rol).toBe('SOCIO');
    });
  });
});
