import { BaseUseCase } from '../shared/use-case.base';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
export declare class ListarSociosUseCase implements BaseUseCase {
    private readonly socioRepository;
    constructor(socioRepository: SocioRepository);
    execute(): Promise<SocioEntity[]>;
    findById(id: number): Promise<SocioEntity | null>;
}
