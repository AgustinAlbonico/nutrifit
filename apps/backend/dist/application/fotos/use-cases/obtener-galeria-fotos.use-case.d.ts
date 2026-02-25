import { BaseUseCase } from 'src/application/shared/use-case.base';
import { GaleriaFotosResponseDto } from 'src/application/fotos/dtos/subir-foto.dto';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
export declare class ObtenerGaleriaFotosUseCase implements BaseUseCase {
    private readonly objectStorageService;
    private readonly fotoProgresoRepository;
    constructor(objectStorageService: IObjectStorageService, fotoProgresoRepository: FotoProgresoRepository);
    execute(socioId: number): Promise<GaleriaFotosResponseDto>;
    private toResponseDto;
}
