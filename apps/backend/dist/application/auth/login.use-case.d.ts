import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { BaseUseCase } from '../shared/use-case.base';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
import { IJwtService } from 'src/domain/services/jwt.service';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { LoginDto } from './dtos/login.dto';
import { Rol } from 'src/domain/entities/Usuario/Rol';
export declare class LoginUseCase implements BaseUseCase {
    private readonly userRepository;
    private readonly passwordEncrypter;
    private readonly jwtService;
    private readonly loggerService;
    constructor(userRepository: UsuarioRepository, passwordEncrypter: IPasswordEncrypterService, jwtService: IJwtService, loggerService: IAppLoggerService);
    execute(payload: LoginDto): Promise<{
        token: string;
        rol: Rol;
        acciones: string[];
    }>;
}
