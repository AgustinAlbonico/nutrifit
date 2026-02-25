import { ObjetivoRepository } from 'src/infrastructure/persistence/typeorm/repositories/objetivo.repository';
import { ObjetivoResponseDto } from '../dtos/objetivo.dto';
export declare class MarcarObjetivoCompletadoUseCase {
    private readonly objetivoRepository;
    constructor(objetivoRepository: ObjetivoRepository);
    execute(objetivoId: number, nuevoEstado: 'COMPLETADO' | 'ABANDONADO'): Promise<ObjetivoResponseDto>;
    private toResponse;
}
