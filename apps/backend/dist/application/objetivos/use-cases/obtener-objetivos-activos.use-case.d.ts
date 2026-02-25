import { ObjetivoRepository } from 'src/infrastructure/persistence/typeorm/repositories/objetivo.repository';
import { ListaObjetivosResponseDto } from '../dtos/objetivo.dto';
export declare class ObtenerObjetivosActivosUseCase {
    private readonly objetivoRepository;
    constructor(objetivoRepository: ObjetivoRepository);
    execute(socioId: number): Promise<ListaObjetivosResponseDto>;
    private toResponse;
}
