import { BaseUseCase } from '../shared/use-case.base';
import { RegistrarSocioDto } from './dtos/registrarSocio.dto';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { UsuarioEntity } from 'src/domain/entities/Usuario/usuario.entity';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { Repository } from 'typeorm';
export declare class RegistrarSocioUseCase implements BaseUseCase {
    private readonly socioRepository;
    private readonly usuarioRepository;
    private readonly logger;
    private readonly passwordEncrypter;
    private readonly grupoPermisoRepository;
    constructor(socioRepository: SocioRepository, usuarioRepository: UsuarioRepository, logger: IAppLoggerService, passwordEncrypter: IPasswordEncrypterService, grupoPermisoRepository: Repository<GrupoPermisoOrmEntity>);
    execute(payload: RegistrarSocioDto, fotoPerfilKey?: string): Promise<UsuarioEntity>;
    private obtenerGrupoSocioPorDefecto;
}
