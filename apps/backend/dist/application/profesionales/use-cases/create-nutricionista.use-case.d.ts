import { BaseUseCase } from 'src/application/shared/use-case.base';
import { CreateNutricionistaDto } from '../dtos/create-nutricionista.dto';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { Repository } from 'typeorm';
export declare class CreateNutricionistaUseCase implements BaseUseCase {
    private readonly nutricionistaRepository;
    private readonly usuarioRepository;
    private readonly logger;
    private readonly passwordEncrypter;
    private readonly grupoPermisoRepository;
    constructor(nutricionistaRepository: NutricionistaRepository, usuarioRepository: UsuarioRepository, logger: IAppLoggerService, passwordEncrypter: IPasswordEncrypterService, grupoPermisoRepository: Repository<GrupoPermisoOrmEntity>);
    execute(payload: CreateNutricionistaDto, fotoPerfilKey?: string): Promise<NutricionistaEntity>;
    private obtenerGrupoProfesionalPorDefecto;
}
