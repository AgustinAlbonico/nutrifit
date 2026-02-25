import { Rol } from 'src/domain/entities/Usuario/Rol';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: {
        sub: number;
        email: string;
        role: Rol;
    }): Promise<{
        idUsuario: number;
        email: string;
        rol: Rol;
    }>;
}
export {};
