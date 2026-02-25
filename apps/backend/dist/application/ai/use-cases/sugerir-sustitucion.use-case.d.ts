import { BaseUseCase } from 'src/application/shared/use-case.base';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { IAiProviderService } from 'src/domain/services/ai-provider.service';
import { RespuestaIA, SolicitudSustitucion, SustitucionAlimento } from '@nutrifit/shared';
export declare class SugerirSustitucionUseCase implements BaseUseCase {
    private readonly aiProvider;
    private readonly logger;
    constructor(aiProvider: IAiProviderService, logger: IAppLoggerService);
    execute(solicitud: SolicitudSustitucion): Promise<RespuestaIA<SustitucionAlimento>>;
    private construirPrompt;
}
