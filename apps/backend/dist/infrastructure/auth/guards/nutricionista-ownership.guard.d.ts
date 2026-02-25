import { CanActivate, ExecutionContext } from '@nestjs/common';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
export declare class NutricionistaOwnershipGuard implements CanActivate {
    private readonly usuarioRepository;
    constructor(usuarioRepository: UsuarioRepository);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
