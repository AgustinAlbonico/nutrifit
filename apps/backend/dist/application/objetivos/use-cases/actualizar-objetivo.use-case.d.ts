import { ObjetivoRepository } from 'src/infrastructure/persistence/typeorm/repositories/objetivo.repository';
import { ActualizarObjetivoDto, ObjetivoResponseDto } from '../dtos/objetivo.dto';
export declare class ActualizarObjetivoUseCase {
    private readonly objetivoRepository;
    constructor(objetivoRepository: ObjetivoRepository);
    execute(objetivoId: number, payload: ActualizarObjetivoDto): Promise<ObjetivoResponseDto>;
    private toResponse;
}
