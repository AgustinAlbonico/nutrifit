import { AlimentosSyncService } from '../alimentos/alimentos-sync.service';
export declare class AlimentosSyncScheduler {
    private readonly alimentosSyncService;
    private readonly logger;
    constructor(alimentosSyncService: AlimentosSyncService);
    ejecutarSincronizacionNocturna(): Promise<void>;
}
