import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { BaseUseCase } from '../shared/use-case.base';
import { UnauthorizedError } from 'src/domain/exceptions/custom-exceptions';
import {
  IPasswordEncrypterService,
  PASSWORD_ENCRYPTER_SERVICE,
} from 'src/domain/services/password-encrypter.service';
import {
  IJwtService,
  JWT_SERVICE,
  JwtPayload,
} from 'src/domain/services/jwt.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { LoginDto } from './dtos/login.dto';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { randomUUID } from 'crypto';

@Injectable()
export class LoginUseCase implements BaseUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly userRepository: UsuarioRepository,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @Inject(JWT_SERVICE)
    private readonly jwtService: IJwtService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly loggerService: IAppLoggerService,
  ) {}

  async execute(
    payload: LoginDto,
  ): Promise<{ token: string; rol: Rol; acciones: string[] }> {
    this.loggerService.log(
      'LoginUseCase: Ejecutando el caso de uso de login para el usuario: ' +
        payload.email,
    );
    const { email, contrasena } = payload;

    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError('No se encontró el usuario');

    const isPasswordValid = await this.passwordEncrypter.comparePasswords(
      contrasena,
      user.contraseña,
    );
    if (!isPasswordValid) throw new UnauthorizedError('Contraseña incorrecta');

    // Bloquear usuarios con fechaBaja (cuenta inactiva)
    const persona = user.persona;
    if (persona?.fechaBaja) {
      throw new UnauthorizedError('La cuenta está inactiva');
    }

    // Extraer gimnasioId desde la persona asociada (tenant isolation)
    // Si la persona no tiene gimnasio asignado, es un estado inválido que no debería
    // permitirse en producción — el fallback a 1 solo aplica para datos legacy/malos
    let gimnasioId: number;
    if (persona?.gimnasioId !== undefined && persona.gimnasioId !== null) {
      gimnasioId = persona.gimnasioId;
    } else {
      this.loggerService.warn(
        `LoginUseCase: Usuario ${email} tiene persona sin gimnasioId, usando fallback a 1 (legacy data)`,
      );
      gimnasioId = 1;
    }
    const personaId = persona?.idPersona ?? null;
    const jti = randomUUID();

    const jwtPayload: JwtPayload = {
      id: user.idUsuario,
      email: user.email,
      rol: user.rol,
      acciones: user.getAccionesEfectivas(),
      personaId,
      gimnasioId,
      jti,
    };

    const token = this.jwtService.sign(jwtPayload);

    this.loggerService.log(
      'LoginUseCase: Login exitoso para el usuario: ' + user.email,
    );

    return { token, rol: user.rol, acciones: user.getAccionesEfectivas() };
  }
}
