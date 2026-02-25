import { BaseUseCase } from 'src/application/shared/use-case.base';
import { FotoProgresoResponseDto, SubirFotoProgresoDto } from 'src/application/fotos/dtos/subir-foto.dto';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
export declare class SubirFotoProgresoUseCase implements BaseUseCase {
    private readonly objectStorageService;
    private readonly fotoProgresoRepository;
    constructor(objectStorageService: IObjectStorageService, fotoProgresoRepository: FotoProgresoRepository);
    execute(payload: SubirFotoProgresoDto, fileBuffer: Buffer, mimeType: string): Promise<FotoProgresoResponseDto>;
    private buildObjectKey;
    private toResponseDto;
}
