import { LoginDto } from 'src/application/auth/dtos/login.dto';
import { LoginUseCase } from 'src/application/auth/login.use-case';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { PermisosService } from 'src/application/permisos/permisos.service';
import { Request } from 'express';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
export declare class AuthController {
    private readonly loginUseCase;
    private readonly permisosService;
    private readonly usuarioRepository;
    private readonly logger;
    constructor(loginUseCase: LoginUseCase, permisosService: PermisosService, usuarioRepository: UsuarioRepository, logger: IAppLoggerService);
    login(body: LoginDto): Promise<{
        token: string;
        rol: import("../../../domain/entities/Usuario/Rol").Rol;
        acciones: string[];
    }>;
    getPermissions(req: Request): Promise<string[]>;
    getProfile(req: Request): Promise<{
        idUsuario: any;
        idPersona: null;
        email: any;
        rol: any;
        nombre: null;
        apellido: null;
        fotoPerfilUrl: null;
    } | {
        idUsuario: number;
        idPersona: number | null;
        email: string;
        rol: import("../../../domain/entities/Usuario/Rol").Rol;
        nombre: string | null;
        apellido: string | null;
        fotoPerfilUrl: string | null;
    }>;
}
