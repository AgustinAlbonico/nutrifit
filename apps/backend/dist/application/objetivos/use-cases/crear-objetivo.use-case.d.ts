import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { ObjetivoRepository } from 'src/infrastructure/persistence/typeorm/repositories/objetivo.repository';
import { Repository } from 'typeorm';
import { CrearObjetivoDto, ObjetivoResponseDto } from '../dtos/objetivo.dto';
export declare class CrearObjetivoUseCase {
    private readonly objetivoRepository;
    private readonly socioRepository;
    constructor(objetivoRepository: ObjetivoRepository, socioRepository: Repository<SocioOrmEntity>);
    execute(payload: CrearObjetivoDto): Promise<ObjetivoResponseDto>;
    private toResponse;
}
