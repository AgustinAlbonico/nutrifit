import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UpdateNutricionistaDto } from '../dtos/update-nutricionista.dto';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
export declare class UpdateNutricionistaUseCase implements BaseUseCase {
    private readonly nutricionistaRepository;
    private readonly usuarioRepository;
    private readonly logger;
    private readonly passwordEncrypter;
    constructor(nutricionistaRepository: NutricionistaRepository, usuarioRepository: UsuarioRepository, logger: IAppLoggerService, passwordEncrypter: IPasswordEncrypterService);
    execute(id: number, payload: UpdateNutricionistaDto, fotoPerfilKey?: string): Promise<NutricionistaEntity>;
}
