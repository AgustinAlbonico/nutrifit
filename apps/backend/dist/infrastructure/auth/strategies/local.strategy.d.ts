import { LoginUseCase } from 'src/application/auth/login.use-case';
declare const LocalStrategy_base: new (...args: any) => any;
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly loginUseCase;
    constructor(loginUseCase: LoginUseCase);
    validate(email: string, contrasena: string): Promise<{
        token: string;
        rol: import("../../../domain/entities/Usuario/Rol").Rol;
        acciones: string[];
    }>;
}
export {};
