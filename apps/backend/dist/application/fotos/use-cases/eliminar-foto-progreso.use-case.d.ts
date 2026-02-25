import { BaseUseCase } from 'src/application/shared/use-case.base';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
export declare class EliminarFotoProgresoUseCase implements BaseUseCase {
    private readonly objectStorageService;
    private readonly fotoProgresoRepository;
    constructor(objectStorageService: IObjectStorageService, fotoProgresoRepository: FotoProgresoRepository);
    execute(fotoId: number, socioId: number): Promise<void>;
}
