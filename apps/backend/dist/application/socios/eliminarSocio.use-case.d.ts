import { BaseUseCase } from '../shared/use-case.base';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
export declare class EliminarSocioUseCase implements BaseUseCase {
    private readonly socioRepository;
    constructor(socioRepository: SocioRepository);
    execute(id: number): Promise<void>;
}
