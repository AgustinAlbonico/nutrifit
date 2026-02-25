import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
export declare const ROLE_KEY = "rol";
export declare const Rol: (...roles: RolEnum[]) => import("@nestjs/common").CustomDecorator<string>;
