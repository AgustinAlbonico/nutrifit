import { SocioRepository } from '../entities/Persona/Socio/socio.repository';
import { UsuarioRepository } from '../entities/Usuario/usuario.repository';
export interface JWTConfig {
    getJwtSecret(): string;
    getJwtExpirationTime(): string;
}
export interface ITransactionService {
    execute<T>(operation: (ctx: ITransactionContext) => Promise<T>): Promise<T>;
}
export interface ITransactionContext {
    socioRepository: SocioRepository;
    usuarioRepository: UsuarioRepository;
}
