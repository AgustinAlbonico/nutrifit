import { BaseUseCase } from '../shared/use-case.base';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
import { ActualizarSocioDto } from './dtos/actualizarSocio.dto';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
export declare class ActualizarSocioUseCase implements BaseUseCase {
    private readonly socioRepository;
    private readonly usuarioRepository;
    private readonly passwordEncrypter;
    constructor(socioRepository: SocioRepository, usuarioRepository: UsuarioRepository, passwordEncrypter: IPasswordEncrypterService);
    execute(id: number, payload: ActualizarSocioDto, fotoPerfilKey?: string): Promise<SocioEntity>;
}
