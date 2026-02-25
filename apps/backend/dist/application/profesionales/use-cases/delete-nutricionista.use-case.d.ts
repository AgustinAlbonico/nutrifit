import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
export declare class DeleteNutricionistaUseCase implements BaseUseCase {
    private readonly nutricionistaRepository;
    private readonly usuarioRepository;
    private readonly logger;
    private readonly nutricionistaOrmRepository;
    private readonly turnoOrmRepository;
    constructor(nutricionistaRepository: NutricionistaRepository, usuarioRepository: UsuarioRepository, logger: IAppLoggerService, nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>, turnoOrmRepository: Repository<TurnoOrmEntity>);
    execute(id: number): Promise<void>;
}
