import type { IAiProviderService } from '../../../domain/services/ai-provider.service';
import { EnvironmentConfigService } from '../../../infrastructure/config/environment-config/environment-config.service';
export declare class GroqService implements IAiProviderService {
    private readonly configService;
    private readonly logger;
    private readonly client;
    private readonly baseUrl;
    private readonly model;
    constructor(configService: EnvironmentConfigService);
    generarRecomendacion<T>(prompt: string, schema: object): Promise<T>;
    verificarConexion(): Promise<boolean>;
}
